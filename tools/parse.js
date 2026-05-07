#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Java source parser for Spring Boot controllers.
 *
 * Walks src/main/java; finds @RestController/@Controller classes; extracts
 * mapping annotations, path/header/query parameters, request bodies, auth
 * gates, response types. Emits a JSON spec.
 *
 * Usage:  node parse.js <service-dir> <service-id> [out.json]
 *
 * Notes
 * -----
 * * Regex-based, not AST. Spring annotations are predictable enough that
 *   AST parsing buys little for substantial complexity. Unparseable details
 *   degrade to "see source" rather than failing.
 * * Filter DTOs are bound by Spring via getters (no @RequestParam). The parser
 *   reads field declarations from DTO files when a non-annotated POJO param
 *   appears in a handler signature.
 */

const fs   = require('fs');
const path = require('path');

// ───────────────────────────────────────────────────────────────────────────
// Filesystem helpers
// ───────────────────────────────────────────────────────────────────────────

function walkJava(root) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name.endsWith('.java')) out.push(p);
    }
  }
  return out;
}

function readSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

// ───────────────────────────────────────────────────────────────────────────
// Source helpers — comments, balanced braces, annotation extraction
// ───────────────────────────────────────────────────────────────────────────

/** Strip Java line/block comments. Returns a string of equal length so offsets stay valid. */
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') { out += ' '; i++; }
    } else if (c === '/' && d === '*') {
      out += '  '; i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' '; i++;
      }
      out += '  '; i += 2;
    } else if (c === '"' || c === "'") {
      const q = c; out += c; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\' && i + 1 < n) { out += src[i] + src[i + 1]; i += 2; continue; }
        out += src[i]; i++;
      }
      if (i < n) { out += src[i]; i++; }
    } else { out += c; i++; }
  }
  return out;
}

/** Find class declaration (class/record/interface). Captures simple name. */
function findClassName(src) {
  const m = src.match(/\b(class|record|interface)\s+([A-Za-z_]\w*)/);
  return m ? m[2] : null;
}

/** Pull a single string-literal value from an annotation-args blob, e.g. value="/foo" or just "/foo". */
function extractStringArg(blob, key) {
  if (!blob) return null;
  if (key) {
    const re = new RegExp(`\\b${key}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`);
    const m = blob.match(re);
    if (m) return m[1];
  }
  // bare positional string at start
  const m2 = blob.match(/^\s*"((?:[^"\\]|\\.)*)"/);
  return m2 ? m2[1] : null;
}

/** Pull a boolean arg. */
function extractBoolArg(blob, key, dflt) {
  if (!blob) return dflt;
  const re = new RegExp(`\\b${key}\\s*=\\s*(true|false)\\b`);
  const m = blob.match(re);
  return m ? m[1] === 'true' : dflt;
}

/** Find the matching close paren for an open paren at index `open`. */
function matchParen(src, open) {
  if (src[open] !== '(' && src[open] !== '{') return -1;
  const closeC = src[open] === '(' ? ')' : '}';
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '{') depth++;
    else if (c === ')' || c === '}') { depth--; if (depth === 0 && c === closeC) return i; }
    else if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
    }
  }
  return -1;
}

/** Match-paren but return body excluding the parens. Returns null if unbalanced. */
function paren(src, open) {
  if (open < 0 || src[open] !== '(') return { body: '', end: open };
  const close = matchParen(src, open);
  if (close < 0) return null;
  return { body: src.slice(open + 1, close), end: close };
}

/** Split a comma-separated arg list, respecting nested () <> {} and strings. */
function splitArgs(s) {
  const out = []; let depth = 0; let buf = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '<' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '>' || c === '}' || c === ']') depth--;
    else if (c === '"' || c === "'") {
      buf += c; i++;
      while (i < s.length && s[i] !== c) {
        if (s[i] === '\\' && i + 1 < s.length) { buf += s[i] + s[i + 1]; i += 2; continue; }
        buf += s[i]; i++;
      }
      if (i < s.length) buf += s[i];
      continue;
    }
    if (c === ',' && depth === 0) { out.push(buf.trim()); buf = ''; continue; }
    buf += c;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

// ───────────────────────────────────────────────────────────────────────────
// Annotation extraction (immediately preceding a target index)
// ───────────────────────────────────────────────────────────────────────────

/** Walk backwards from `at` over whitespace, collecting all @Annotations (with bodies). */
const JAVA_MODIFIERS = new Set([
  'public', 'protected', 'private', 'abstract', 'final', 'static',
  'sealed', 'non-sealed', 'default', 'synchronized', 'native', 'strictfp'
]);

function collectLeadingAnnotations(src, at) {
  let i = at;
  // step back over any whitespace
  while (i > 0 && /\s/.test(src[i - 1])) i--;
  const annotations = [];
  while (i > 0) {
    // an annotation starts at some `@`, ends just before `at` walk
    // walk backwards looking for '@'
    let j = i - 1;
    // skip whitespace
    while (j > 0 && /\s/.test(src[j])) j--;
    // possible annotation: ...@Name(...) or @Name
    // find '@' on this annotation's position
    // search backwards for '@' or non-annotation char
    // strategy: if char at j is ')' then the annotation has args; we need to find the matching '('
    let endIdx;
    if (src[j] === ')') {
      endIdx = j + 1;
      // find matching open paren
      let depth = 1; let k = j - 1;
      while (k >= 0 && depth > 0) {
        const c = src[k];
        if (c === ')') depth++;
        else if (c === '(') depth--;
        else if (c === '"' || c === "'") {
          const q = c; k--;
          while (k >= 0 && src[k] !== q) { if (src[k - 1] === '\\') k--; k--; }
        }
        if (depth === 0) break;
        k--;
      }
      if (k < 0) break;
      // now find @Name backwards from k
      let m = k - 1;
      while (m >= 0 && /[A-Za-z0-9_.]/.test(src[m])) m--;
      if (src[m] !== '@') break;
      annotations.unshift({ raw: src.slice(m, endIdx), at: m });
      i = m;
    } else if (/[A-Za-z0-9_]/.test(src[j])) {
      // bare annotation like @Override (no parens), or a Java modifier
      // (public/abstract/...) sitting between annotations and the class/method.
      let m = j;
      while (m >= 0 && /[A-Za-z0-9_.-]/.test(src[m])) m--;
      if (src[m] === '@') {
        annotations.unshift({ raw: src.slice(m, j + 1), at: m });
        i = m;
      } else if (JAVA_MODIFIERS.has(src.slice(m + 1, j + 1))) {
        // skip past the modifier and keep walking back for more annotations
        i = m + 1;
      } else break;
    } else break;
    while (i > 0 && /\s/.test(src[i - 1])) i--;
  }
  return annotations;
}

function annName(raw) { const m = raw.match(/^@([A-Za-z_][\w.]*)/); return m ? m[1].split('.').pop() : null; }
function annBody(raw) {
  const open = raw.indexOf('(');
  if (open < 0) return '';
  const close = matchParen(raw, open);
  if (close < 0) return '';
  return raw.slice(open + 1, close);
}

// ───────────────────────────────────────────────────────────────────────────
// Parameter parsing (method signatures)
// ───────────────────────────────────────────────────────────────────────────

/**
 * Parse a Java parameter declaration. Returns { annotations[], type, name }.
 * The annotations array contains { name, body }.
 */
function parseParam(decl) {
  decl = decl.trim();
  const annotations = [];
  // walk leading annotations
  while (decl.startsWith('@')) {
    let i = 1;
    while (i < decl.length && /[A-Za-z0-9_.]/.test(decl[i])) i++;
    const name = decl.slice(1, i).split('.').pop();
    let body = '';
    if (decl[i] === '(') {
      const cl = matchParen(decl, i);
      if (cl < 0) break;
      body = decl.slice(i + 1, cl);
      i = cl + 1;
    }
    annotations.push({ name, body });
    decl = decl.slice(i).trimStart();
  }
  // type — everything up to last whitespace before name
  // handle generics: type may contain <...> with spaces. Walk from end to find the last identifier (the name).
  let n = decl.length - 1;
  while (n >= 0 && /[A-Za-z0-9_]/.test(decl[n])) n--;
  const name = decl.slice(n + 1).trim();
  let type = decl.slice(0, n + 1).trim();
  // strip "final " modifier
  type = type.replace(/^final\s+/, '');
  return { annotations, type, name };
}

// ───────────────────────────────────────────────────────────────────────────
// DTO field extraction
// ───────────────────────────────────────────────────────────────────────────

const DTO_CACHE = new Map();   // file path → fields[]

/**
 * Resolve a simple type name in a controller's import context.
 *   1. If the controller imports `com.x.y.SimpleName` exactly, use that file.
 *   2. Otherwise prefer a file in the controller's own package.
 *   3. Otherwise fall back to any same-named file (logged).
 */
function findDtoFile(simpleName, ctx) {
  const { javaFiles, ctrlPackage, imports } = ctx;
  // 1. import-qualified
  for (const imp of imports) {
    if (imp.endsWith('.' + simpleName) || imp === simpleName) {
      const rel = imp.replace(/\./g, '/') + '.java';
      const hit = javaFiles.find(f => f.replace(/\\/g, '/').endsWith('/' + rel));
      if (hit) return hit;
    }
    // wildcard import: com.x.y.*
    if (imp.endsWith('.*')) {
      const pkg = imp.slice(0, -2);
      const rel = pkg.replace(/\./g, '/') + '/' + simpleName + '.java';
      const hit = javaFiles.find(f => f.replace(/\\/g, '/').endsWith('/' + rel));
      if (hit) return hit;
    }
  }
  // 2. same package
  if (ctrlPackage) {
    const rel = ctrlPackage.replace(/\./g, '/') + '/' + simpleName + '.java';
    const sib = javaFiles.find(f => f.replace(/\\/g, '/').endsWith('/' + rel));
    if (sib) return sib;
    // also check `<ctrlPackage>.dto`
    const subRel = ctrlPackage.replace(/\./g, '/') + '/dto/' + simpleName + '.java';
    const sibDto = javaFiles.find(f => f.replace(/\\/g, '/').endsWith('/' + subRel));
    if (sibDto) return sibDto;
  }
  // 3. last-resort, any file matching the simple name
  return javaFiles.find(f => path.basename(f) === simpleName + '.java') || null;
}

/** Extract field declarations from a DTO source. Lombok @Getter/@Setter assumed. */
function readDtoFields(src) {
  // remove static initialisers and methods to focus on field declarations
  // simple heuristic: look for "private <Type> <name>;" statements outside of method bodies
  // we strip method bodies by skipping content within { } at class scope
  const fields = [];
  // First, locate the outermost class body
  const classMatch = src.match(/\b(class|record)\s+[A-Za-z_]\w*[^{]*\{/);
  if (!classMatch) return fields;
  const bodyStart = classMatch.index + classMatch[0].length - 1;
  const bodyEnd = matchParen(src, bodyStart);
  if (bodyEnd < 0) return fields;
  const body = src.slice(bodyStart + 1, bodyEnd);

  // walk top-level statements (depth 0) and capture declarations
  let depth = 0; let stmt = ''; let topLevel = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    if (depth === 0) topLevel += c;
  }

  // Now top-level fields look like: [annotations]* [private|protected|public] [final] Type name [= ...] ;
  const fieldRe = /(?:@[A-Za-z_][\w.]*(?:\([^)]*\))?\s*)*(?:private|protected|public)\s+(?:static\s+|final\s+)*([A-Za-z_][\w.]*(?:\s*<[^;]*?>)?)\s+([A-Za-z_]\w*)\s*(?:=[^;]*)?;/g;
  let m;
  while ((m = fieldRe.exec(topLevel)) !== null) {
    const type = m[1].replace(/\s+/g, '');
    const name = m[2];
    if (/^[A-Z][A-Z0-9_]+$/.test(name)) continue; // skip CONSTANTS
    // try to read a leading @DateTimeFormat pattern for notes
    const before = topLevel.slice(0, m.index);
    const dt = before.match(/@DateTimeFormat\(\s*pattern\s*=\s*"([^"]+)"\s*\)\s*$/);
    fields.push({ name, type, format: dt ? dt[1] : null });
  }
  // Dedup by name
  const seen = new Set();
  return fields.filter(f => (seen.has(f.name) ? false : seen.add(f.name)));
}

function lookupDto(simpleName, ctx) {
  const f = findDtoFile(simpleName, ctx);
  if (!f) return null;
  if (DTO_CACHE.has(f)) return DTO_CACHE.get(f);
  const src = stripComments(readSafe(f));
  const fields = readDtoFields(src);
  DTO_CACHE.set(f, fields);
  return fields;
}

// ───────────────────────────────────────────────────────────────────────────
// DTO Registry & recursive schema resolution
// ───────────────────────────────────────────────────────────────────────────

const SAMPLE_DATE      = '2026-05-05';
const SAMPLE_DATETIME  = '2026-05-05T00:00:00';
const SAMPLE_INSTANT   = '2026-05-05T00:00:00Z';
const MAX_SCHEMA_DEPTH = 6;

/** Per-type primitive metadata: jsonType + a sample value to use in synthesized JSON. */
const PRIMITIVE_INFO = {
  String:         { jsonType: 'string',  sample: 'string' },
  CharSequence:   { jsonType: 'string',  sample: 'string' },
  char:           { jsonType: 'string',  sample: 'a' },
  Character:      { jsonType: 'string',  sample: 'a' },
  int:            { jsonType: 'integer', sample: 0 },
  Integer:        { jsonType: 'integer', sample: 0 },
  long:           { jsonType: 'integer', sample: 0 },
  Long:           { jsonType: 'integer', sample: 0 },
  short:          { jsonType: 'integer', sample: 0 },
  Short:          { jsonType: 'integer', sample: 0 },
  byte:           { jsonType: 'integer', sample: 0 },
  Byte:           { jsonType: 'integer', sample: 0 },
  float:          { jsonType: 'number',  sample: 0 },
  Float:          { jsonType: 'number',  sample: 0 },
  double:         { jsonType: 'number',  sample: 0 },
  Double:         { jsonType: 'number',  sample: 0 },
  boolean:        { jsonType: 'boolean', sample: false },
  Boolean:        { jsonType: 'boolean', sample: false },
  BigDecimal:     { jsonType: 'number',  sample: 0 },
  BigInteger:     { jsonType: 'integer', sample: 0 },
  Number:         { jsonType: 'number',  sample: 0 },
  LocalDate:      { jsonType: 'string',  sample: SAMPLE_DATE,     format: 'date' },
  LocalDateTime:  { jsonType: 'string',  sample: SAMPLE_DATETIME, format: 'date-time' },
  LocalTime:      { jsonType: 'string',  sample: '00:00:00',      format: 'time' },
  OffsetDateTime: { jsonType: 'string',  sample: SAMPLE_INSTANT,  format: 'date-time' },
  ZonedDateTime:  { jsonType: 'string',  sample: SAMPLE_INSTANT,  format: 'date-time' },
  Instant:        { jsonType: 'string',  sample: SAMPLE_INSTANT,  format: 'date-time' },
  Date:           { jsonType: 'string',  sample: SAMPLE_INSTANT,  format: 'date-time' },
  YearMonth:      { jsonType: 'string',  sample: '2026-05',       format: 'year-month' },
  MonthDay:       { jsonType: 'string',  sample: '--05-05',       format: 'month-day' },
  Year:           { jsonType: 'integer', sample: 2026 },
  UUID:           { jsonType: 'string',  sample: '00000000-0000-0000-0000-000000000000', format: 'uuid' },
  URI:            { jsonType: 'string',  sample: 'https://example.com', format: 'uri' },
  URL:            { jsonType: 'string',  sample: 'https://example.com', format: 'uri' },
  Object:         { jsonType: 'object',  sample: {} },
  JsonNode:       { jsonType: 'object',  sample: {} },
  ObjectNode:     { jsonType: 'object',  sample: {} },
  ArrayNode:      { jsonType: 'array',   sample: [] },
  Void:           { jsonType: 'null',    sample: null },
  void:           { jsonType: 'null',    sample: null }
};
const PRIMITIVE_NAMES = new Set(Object.keys(PRIMITIVE_INFO));

/** Spring/servlet types: don't try to resolve, render as a hint. */
const SPRING_INFRA = new Set([
  'Pageable', 'Sort', 'PageRequest',
  'MultipartFile', 'HttpServletRequest', 'HttpServletResponse',
  'HttpHeaders', 'HttpEntity',
  'Authentication', 'Principal', 'BindingResult',
  'Model', 'ModelAndView', 'RedirectAttributes', 'UriComponentsBuilder',
  'Locale', 'TimeZone', 'InputStream', 'OutputStream', 'Reader', 'Writer',
  'Resource', 'ByteArrayResource', 'InputStreamResource'
]);

const COLLECTION_TYPES = new Set(['List','Set','Collection','Iterable','Queue','Deque']);
const PAGE_TYPES       = new Set(['Page','Slice','PageImpl']);
const WRAPPER_TYPES    = new Set(['Optional','ResponseEntity','Mono','Flux','Callable','Future','CompletableFuture']);

/** Strip leading `@Foo`/`@Foo(...)` tokens and `final` from a type expression. */
function cleanType(t) {
  if (!t) return '';
  let s = String(t);
  // strip @Annotations (with or without args)
  // do this iteratively because there may be several
  let prev = null;
  while (prev !== s) {
    prev = s;
    s = s.replace(/^\s*@[A-Za-z_][\w.]*\s*(?:\([^)]*\))?\s*/, '');
  }
  s = s.replace(/^\s*final\s+/, '');
  return s.trim();
}

/** Pick out the raw type-arg list inside the *outermost* `<...>` of a type, or null. */
function outerTypeArgs(t) {
  const lt = t.indexOf('<');
  if (lt < 0) return null;
  let depth = 0;
  for (let i = lt; i < t.length; i++) {
    if (t[i] === '<') depth++;
    else if (t[i] === '>') { depth--; if (depth === 0) return t.slice(lt + 1, i); }
  }
  return null;
}

/** Strip the outermost `<...>` from a type, if any, returning the bare name. */
function bareTypeName(t) {
  const lt = t.indexOf('<');
  if (lt < 0) return t.replace(/\[\]+$/, '').trim();
  return t.slice(0, lt).trim();
}

/** Read fully-qualified package + simple class name + body location for every top-level type in `src`. */
function scanTopLevelTypes(src) {
  const out = [];
  const pkgM = src.match(/^\s*package\s+([\w.]+)\s*;/m);
  const pkg = pkgM ? pkgM[1] : '';
  const re = /\b(class|record|interface|enum)\s+([A-Za-z_]\w*)(\s*<[^{(]*?>)?/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    // Must be top-level: depth at this offset must be 0.
    const at = m.index;
    let depth = 0;
    for (let i = 0; i < at; i++) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
    }
    if (depth !== 0) continue;
    const kind = m[1];
    const simpleName = m[2];
    const tparams = (m[3] || '').replace(/^\s*<\s*/, '').replace(/\s*>\s*$/, '');
    const typeParams = tparams
      ? splitArgs(tparams).map(p => p.replace(/\s+extends\s+.*$/, '').trim()).filter(Boolean)
      : [];
    // Find class header: walk back to `extends`/`implements` clauses up to the `{`
    const headerStart = m.index;
    const braceIdx = src.indexOf('{', m.index);
    const parenIdx = (kind === 'record') ? src.indexOf('(', m.index) : -1;
    if (braceIdx < 0) continue;
    const headerEnd = braceIdx;
    const header = src.slice(headerStart, headerEnd);
    let extendsName = null;
    const exM = header.match(/\bextends\s+([A-Za-z_][\w.]*(?:\s*<[^{]*?>)?)/);
    if (exM) extendsName = exM[1].replace(/\s+/g, '');
    // Match the body braces
    const bodyEnd = matchParen(src, braceIdx);
    if (bodyEnd < 0) continue;
    const body = src.slice(braceIdx + 1, bodyEnd);
    // For records, capture the parameter list as the field source
    let recordComponents = null;
    if (kind === 'record' && parenIdx > 0 && parenIdx < braceIdx) {
      const cl = matchParen(src, parenIdx);
      if (cl > 0) recordComponents = src.slice(parenIdx + 1, cl);
    }
    out.push({
      pkg,
      simpleName,
      fqn: pkg ? `${pkg}.${simpleName}` : simpleName,
      kind,
      typeParams,
      extendsName,
      body,
      recordComponents
    });
  }
  return out;
}

const VALIDATION_ANNS = new Set([
  'NotNull','NotBlank','NotEmpty','Null',
  'Size','Pattern','Email','Min','Max',
  'DecimalMin','DecimalMax','Digits','Positive','PositiveOrZero','Negative','NegativeOrZero',
  'Past','PastOrPresent','Future','FutureOrPresent','AssertTrue','AssertFalse'
]);

/** Parse a `private Type name [= ...];` declaration's annotations into a small object. */
function parseFieldAnnotations(annotationBlock) {
  if (!annotationBlock) return { validations: [], format: null, jsonName: null, ignored: false, description: null };
  const out = { validations: [], format: null, jsonName: null, ignored: false, description: null };
  const re = /@([A-Za-z_][\w.]*)(?:\s*\(([^)]*)\))?/g;
  let m;
  while ((m = re.exec(annotationBlock)) !== null) {
    const name = m[1].split('.').pop();
    const body = m[2] || '';
    if (VALIDATION_ANNS.has(name)) {
      const v = { name };
      // Capture the most useful single param (value/min/max/pattern/regexp)
      const arg = extractStringArg(body, 'value')
                ?? extractStringArg(body, 'message')
                ?? extractStringArg(body, 'pattern')
                ?? extractStringArg(body, 'regexp')
                ?? extractStringArg(body, null);
      if (arg) v.value = arg;
      const minM = body.match(/\bmin\s*=\s*"?([^",)]+)"?/); if (minM) v.min = minM[1].trim();
      const maxM = body.match(/\bmax\s*=\s*"?([^",)]+)"?/); if (maxM) v.max = maxM[1].trim();
      out.validations.push(v);
    } else if (name === 'DateTimeFormat' || name === 'JsonFormat') {
      const pat = extractStringArg(body, 'pattern') ?? extractStringArg(body, null);
      if (pat) out.format = pat;
    } else if (name === 'JsonProperty') {
      const v = extractStringArg(body, 'value') ?? extractStringArg(body, null);
      if (v) out.jsonName = v;
    } else if (name === 'JsonIgnore') {
      out.ignored = true;
    } else if (name === 'Schema') {
      const desc = extractStringArg(body, 'description');
      if (desc) out.description = desc;
      const exM = extractStringArg(body, 'example');
      if (exM != null) out.example = exM;
    }
  }
  return out;
}

/** Read class/record fields. Captures rawType, name, validation/format/json/description annotations. */
function readFieldsFromClassRecord(rec) {
  const fields = [];
  if (rec.kind === 'record' && rec.recordComponents) {
    for (const comp of splitArgs(rec.recordComponents)) {
      const decl = comp.trim(); if (!decl) continue;
      // [annotations]* Type name
      const ann = [];
      let s = decl;
      while (s.startsWith('@')) {
        let i = 1;
        while (i < s.length && /[A-Za-z0-9_.]/.test(s[i])) i++;
        let body = '';
        if (s[i] === '(') {
          const cl = matchParen(s, i);
          if (cl < 0) break;
          body = s.slice(i + 1, cl);
          i = cl + 1;
        }
        ann.push(`@${s.slice(1).split(/\s/)[0]}${body ? `(${body})` : ''}`);
        s = s.slice(i).trimStart();
      }
      // remaining: Type name
      let n = s.length - 1;
      while (n >= 0 && /[A-Za-z0-9_]/.test(s[n])) n--;
      const name = s.slice(n + 1).trim();
      const rawType = s.slice(0, n + 1).trim();
      if (!name || !rawType) continue;
      const meta = parseFieldAnnotations(ann.join(' '));
      fields.push({ name, rawType, ...meta });
    }
    return fields;
  }
  if (rec.kind === 'enum' || rec.kind === 'interface') return fields;
  // Class: walk top-level declarations within body
  const body = rec.body || '';
  // Strip nested class/method bodies — keep only depth-0 chars
  let depth = 0; let topLevel = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    if (depth === 0) topLevel += c;
  }
  // Field pattern: optional annotations (with possible parens), then a visibility, then type, then name [= …]; semicolon ends.
  const fieldRe = /((?:@[A-Za-z_][\w.]*\s*(?:\([^)]*\))?\s*)*)(?:(?:private|protected|public)\s+)?(?:(?:static|final|transient|volatile)\s+)*([A-Za-z_][\w.]*(?:\s*<[^;]*?>)?(?:\s*\[\s*\])?)\s+([A-Za-z_]\w*)\s*(?:=[^;]*)?;/g;
  let m;
  while ((m = fieldRe.exec(topLevel)) !== null) {
    const annBlock = m[1];
    let rawType = m[2].replace(/\s+/g, '');
    const name = m[3];
    if (/^[A-Z][A-Z0-9_]+$/.test(name)) continue; // CONSTANTS
    if (rawType === 'return' || rawType === 'new') continue;
    const meta = parseFieldAnnotations(annBlock);
    if (meta.ignored) continue;
    fields.push({ name, rawType, ...meta });
  }
  // Dedup by name (Lombok @Builder.Default + same field, etc.)
  const seen = new Set();
  return fields.filter(f => (seen.has(f.name) ? false : seen.add(f.name)));
}

function readEnumValues(rec) {
  if (rec.kind !== 'enum' || !rec.body) return [];
  const body = rec.body;
  // Constants live before the first ';' at depth 0.
  let cut = -1; let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '(' || c === '{') depth++;
    else if (c === ')' || c === '}') depth--;
    else if (c === ';' && depth === 0) { cut = i; break; }
  }
  const head = cut < 0 ? body : body.slice(0, cut);
  // Each constant: optional annotations, then NAME, optionally followed by (...)
  const out = [];
  const re = /(?:@[A-Za-z_][\w.]*(?:\([^)]*\))?\s*)*\b([A-Z][A-Z0-9_]*)\b\s*(?:\([^)]*\))?\s*(?:,|$)/g;
  let m;
  while ((m = re.exec(head)) !== null) out.push(m[1]);
  return Array.from(new Set(out));
}

/** Build a registry from a list of Java files. */
function buildRegistry(javaFiles) {
  const byFqn = new Map();
  const bySimpleName = new Map();
  for (const file of javaFiles) {
    const raw = readSafe(file);
    if (!raw) continue;
    const src = stripComments(raw);
    for (const top of scanTopLevelTypes(src)) {
      const rec = {
        fqn: top.fqn,
        simpleName: top.simpleName,
        pkg: top.pkg,
        kind: top.kind,
        typeParams: top.typeParams,
        extendsName: top.extendsName,
        file,
        fields: [],
        enumValues: []
      };
      if (top.kind === 'enum') {
        rec.enumValues = readEnumValues(top);
      } else {
        rec.fields = readFieldsFromClassRecord(top);
      }
      byFqn.set(top.fqn, rec);
      if (!bySimpleName.has(top.simpleName)) bySimpleName.set(top.simpleName, []);
      bySimpleName.get(top.simpleName).push(top.fqn);
    }
  }
  return { byFqn, bySimpleName, javaFiles };
}

/** Find the FQN for a simple name in the controller's import context. */
function resolveSimpleName(simpleName, registry, ctx) {
  if (!simpleName) return null;
  const candidates = registry.bySimpleName.get(simpleName) || [];
  if (candidates.length === 1) return candidates[0];
  if (candidates.length === 0) return null;
  // Disambiguate via imports.
  const imports = (ctx && ctx.imports) || [];
  for (const imp of imports) {
    if (imp.endsWith('.' + simpleName) || imp === simpleName) {
      if (candidates.includes(imp)) return imp;
    }
    if (imp.endsWith('.*')) {
      const pkg = imp.slice(0, -2);
      const fqn = `${pkg}.${simpleName}`;
      if (candidates.includes(fqn)) return fqn;
    }
  }
  // Same package as controller
  if (ctx && ctx.ctrlPackage) {
    const sib = `${ctx.ctrlPackage}.${simpleName}`;
    if (candidates.includes(sib)) return sib;
  }
  // Last resort: first candidate (warn at build time when ambiguous).
  return candidates[0];
}

/** Apply a {T → ConcreteType} substitution map to a raw type string. */
function applyTypeSubs(rawType, subs) {
  if (!subs || Object.keys(subs).length === 0) return rawType;
  let t = rawType;
  for (const [k, v] of Object.entries(subs)) {
    if (!v) continue;
    t = t.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
  }
  return t;
}

/**
 * Resolve a Java type expression to a normalized schema node.
 * Returns nodes shaped:
 *   { kind: 'object'|'array'|'map'|'enum'|'primitive'|'unknown'|'cycle'|'truncated'|'page',
 *     name, of?, key?, value?, fields?, values?, format?, validations?, fqn?, paginated? }
 */
function resolveSchema(rawType, registry, ctx, depth = 0, seen = new Set(), subs = {}) {
  let t = cleanType(rawType);
  if (!t) return { kind: 'unknown', name: '?' };
  t = applyTypeSubs(t, subs);

  // Wrappers — unwrap one layer
  for (const w of WRAPPER_TYPES) {
    const re = new RegExp(`^${w}\\s*<\\s*([\\s\\S]+?)\\s*>$`);
    const m = t.match(re);
    if (m) return resolveSchema(m[1], registry, ctx, depth, seen, subs);
  }

  // Page<T> / Slice<T>
  for (const w of PAGE_TYPES) {
    const re = new RegExp(`^${w}\\s*<\\s*([\\s\\S]+?)\\s*>$`);
    const m = t.match(re);
    if (m) {
      const inner = resolveSchema(m[1], registry, ctx, depth, seen, subs);
      return { kind: 'page', name: w, of: inner };
    }
  }

  // Array T[]
  if (/\[\]+$/.test(t)) {
    const inner = t.replace(/\[\]+$/, '');
    return { kind: 'array', of: resolveSchema(inner, registry, ctx, depth, seen, subs) };
  }

  // Map<K, V>
  const mapBare = bareTypeName(t);
  if (mapBare === 'Map' || mapBare === 'HashMap' || mapBare === 'LinkedHashMap' || mapBare === 'TreeMap' || mapBare === 'ConcurrentHashMap') {
    const args = outerTypeArgs(t);
    if (args) {
      const parts = splitArgs(args);
      if (parts.length >= 2) {
        return {
          kind: 'map',
          key: resolveSchema(parts[0], registry, ctx, depth, seen, subs),
          value: resolveSchema(parts[1], registry, ctx, depth, seen, subs)
        };
      }
    }
    return { kind: 'map', key: { kind: 'primitive', name: 'String', sample: 'key' }, value: { kind: 'unknown', name: 'Object' } };
  }

  // Collections
  if (COLLECTION_TYPES.has(mapBare) || /^(?:Array|LinkedHash|Hash|Tree)?(?:List|Set)$/.test(mapBare)) {
    const args = outerTypeArgs(t);
    const inner = args ? splitArgs(args)[0] : 'Object';
    return { kind: 'array', of: resolveSchema(inner, registry, ctx, depth, seen, subs) };
  }

  const baseSimple = mapBare.split('.').pop();

  // Substitution — bare type-param name
  if (subs[baseSimple]) {
    return resolveSchema(subs[baseSimple], registry, ctx, depth, seen, {});
  }

  // Primitive
  if (PRIMITIVE_INFO[baseSimple]) {
    const info = PRIMITIVE_INFO[baseSimple];
    return {
      kind: 'primitive',
      name: baseSimple,
      jsonType: info.jsonType,
      sample: info.sample,
      format: info.format
    };
  }

  // Spring infra
  if (SPRING_INFRA.has(baseSimple)) {
    return { kind: 'unknown', name: baseSimple, note: 'spring' };
  }

  // Object via registry
  const fqn = registry ? resolveSimpleName(baseSimple, registry, ctx) : null;
  if (!fqn) return { kind: 'unknown', name: baseSimple };

  const rec = registry.byFqn.get(fqn);
  if (!rec) return { kind: 'unknown', name: baseSimple };

  if (rec.kind === 'enum') {
    return { kind: 'enum', name: baseSimple, fqn, values: rec.enumValues };
  }

  if (seen.has(fqn)) return { kind: 'cycle', name: baseSimple, fqn };
  if (depth >= MAX_SCHEMA_DEPTH) return { kind: 'truncated', name: baseSimple, fqn };

  // Build substitution from outer type args
  const outerArgs = outerTypeArgs(t);
  const argList = outerArgs ? splitArgs(outerArgs) : [];
  const newSubs = {};
  for (let i = 0; i < (rec.typeParams || []).length; i++) {
    newSubs[rec.typeParams[i]] = argList[i] || 'Object';
  }

  const newSeen = new Set(seen); newSeen.add(fqn);

  // Collect inherited fields from extends chain (best-effort, single inheritance)
  const allFields = [];
  const collectFromRec = (currentRec, currentSubs) => {
    if (currentRec.extendsName) {
      const parentBare = bareTypeName(currentRec.extendsName);
      const parentFqn = resolveSimpleName(parentBare, registry, ctx);
      if (parentFqn && !newSeen.has(parentFqn)) {
        const parentRec = registry.byFqn.get(parentFqn);
        if (parentRec && parentRec.kind !== 'enum' && parentRec.kind !== 'interface') {
          // Apply inherited type-arg substitutions
          const parentOuter = outerTypeArgs(currentRec.extendsName);
          const parentArgs = parentOuter ? splitArgs(parentOuter) : [];
          const parentSubs = {};
          for (let i = 0; i < (parentRec.typeParams || []).length; i++) {
            parentSubs[parentRec.typeParams[i]] = applyTypeSubs(parentArgs[i] || 'Object', currentSubs);
          }
          newSeen.add(parentFqn);
          collectFromRec(parentRec, parentSubs);
        }
      }
    }
    for (const f of (currentRec.fields || [])) {
      allFields.push({ ...f, _subs: currentSubs });
    }
  };
  collectFromRec(rec, newSubs);

  // Dedup by name (child wins over parent — child fields come last in allFields)
  const byName = new Map();
  for (const f of allFields) byName.set(f.name, f);

  const fields = Array.from(byName.values()).map(f => {
    const concreteType = applyTypeSubs(f.rawType, f._subs);
    const required = (f.validations || []).some(v =>
      v.name === 'NotNull' || v.name === 'NotBlank' || v.name === 'NotEmpty'
    );
    return {
      name: f.jsonName || f.name,
      type: concreteType,
      required,
      format: f.format || null,
      description: f.description || null,
      example: f.example !== undefined ? f.example : null,
      validations: f.validations || [],
      schema: resolveSchema(concreteType, registry, ctx, depth + 1, newSeen, {})
    };
  });

  return { kind: 'object', name: baseSimple, fqn, fields };
}

/** Build a JSON example from a resolved schema. */
function synthesizeSample(schema) {
  if (!schema) return null;
  switch (schema.kind) {
    case 'primitive': return schema.sample !== undefined ? schema.sample : null;
    case 'enum':      return (schema.values && schema.values[0]) || null;
    case 'array':     return [synthesizeSample(schema.of)];
    case 'map': {
      const k = synthesizeSample(schema.key);
      const key = (k == null) ? 'key' : String(k);
      return { [key]: synthesizeSample(schema.value) };
    }
    case 'page': {
      return {
        content: [synthesizeSample(schema.of)],
        pageable: { pageNumber: 0, pageSize: 20 },
        totalElements: 0,
        totalPages: 0,
        last: true,
        first: true,
        numberOfElements: 1,
        size: 20,
        number: 0
      };
    }
    case 'object': {
      const obj = {};
      for (const f of (schema.fields || [])) {
        if (f.example !== null && f.example !== undefined) {
          obj[f.name] = f.example;
        } else {
          obj[f.name] = synthesizeSample(f.schema);
        }
      }
      return obj;
    }
    case 'cycle':     return null;
    case 'truncated': return `<${schema.name}>`;
    case 'unknown':
    default:          return null;
  }
}

/** Detect the .setData(<expr>) target's static type from a method body. */
function detectResponseDataType(body) {
  if (!body) return { rawExpr: null, type: null };
  const m = body.match(/\.setData\s*\(\s*([\s\S]+?)\s*\)\s*;/);
  if (!m) return { rawExpr: null, type: null };
  const expr = m[1].trim();

  // new FooDTO(...) / new FooDTO<>(...)
  const newM = expr.match(/^new\s+([A-Za-z_][\w.]*(?:\s*<[^>]*>)?)/);
  if (newM) return { rawExpr: expr, type: newM[1].replace(/\s+/g, '') };

  // bare identifier — find local declaration
  if (/^[A-Za-z_]\w*$/.test(expr)) {
    // <Type> name = ...; — need to be careful not to catch `return name = ...` etc.
    const declRe = new RegExp(`(?:^|[\\s;{(])((?:[A-Za-z_][\\w.]*)(?:\\s*<[^;]+?>)?(?:\\s*\\[\\s*\\])?)\\s+${expr}\\s*=`);
    const dm = body.match(declRe);
    if (dm) {
      const t = dm[1].replace(/\s+/g, '');
      if (!/^(public|private|protected|static|final|return|new|else|if|throw|throws|var)$/.test(t)) {
        return { rawExpr: expr, type: t };
      }
    }
    // for (Type name : ...) — fairly rare for setData target but cheap to check
    const forRe = new RegExp(`for\\s*\\(\\s*((?:[A-Za-z_][\\w.]*)(?:\\s*<[^>]+?>)?)\\s+${expr}\\s*:`);
    const fm = body.match(forRe);
    if (fm) return { rawExpr: expr, type: fm[1].replace(/\s+/g, '') };
  }

  // Method call or chained — not statically inferrable; keep raw for display
  return { rawExpr: expr, type: null };
}

/**
 * Read class-level fields (typically Spring service injections) into `{ name: simpleType }`.
 * Used to follow `<svc>.<method>(...)` calls back into the service interface/impl.
 */
function extractClassFields(classBody) {
  const fields = {};
  // Strip nested {...} so we only see top-level declarations.
  let depth = 0; let top = '';
  for (let i = 0; i < classBody.length; i++) {
    const c = classBody[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    if (depth === 0) top += c;
  }
  const re = /(?:^|[\n;])\s*(?:@[A-Za-z_][\w.]*(?:\s*\([^)]*\))?\s*)*(?:private|protected|public)\s+(?:(?:static|final|transient|volatile)\s+)*([A-Za-z_][\w.]*(?:\s*<[^>;]+>)?)\s+([A-Za-z_]\w*)\s*[=;]/g;
  let m;
  while ((m = re.exec(top)) !== null) {
    const rawType = m[1].replace(/\s+/g, '');
    const name = m[2];
    if (/^[A-Z][A-Z0-9_]+$/.test(name)) continue; // constants
    fields[name] = rawType;
  }
  return fields;
}

const _METHOD_BODY_CACHE = new Map(); // file → simpleName → methodName → { body, returnType }

function _getClassMethods(rec) {
  if (!rec || !rec.file) return null;
  let perFile = _METHOD_BODY_CACHE.get(rec.file);
  if (!perFile) { perFile = new Map(); _METHOD_BODY_CACHE.set(rec.file, perFile); }
  let perClass = perFile.get(rec.simpleName);
  if (perClass) return perClass;
  perClass = {};
  perFile.set(rec.simpleName, perClass);
  const src = stripComments(readSafe(rec.file));
  const tops = scanTopLevelTypes(src);
  const top = tops.find(t => t.simpleName === rec.simpleName);
  if (!top) return perClass;
  const body = top.body;
  // Walk method declarations: returnType methodName ( ... ) [throws ...] { ... }
  // Build a regex that finds candidate method-name openers; then validate by checking
  // that what precedes is a return type, not control flow / new-expr / etc.
  const re = /\b([A-Za-z_]\w*)\s*\(/g;
  let m;
  let depth = 0; // outer depth in body
  // Pre-compute a depth map (depth at each char), so we only consider depth==0 declarations.
  const depths = new Int32Array(body.length);
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    depths[i] = depth;
  }
  while ((m = re.exec(body)) !== null) {
    const nameAt = m.index;
    if (depths[nameAt] !== 0) continue;
    const methodName = m[1];
    if (/^(if|while|for|switch|return|new|throw|catch|synchronized)$/.test(methodName)) continue;
    // Walk back to find the return type and any modifiers.
    let k = nameAt - 1;
    while (k >= 0 && /\s/.test(body[k])) k--;
    let typeEnd = k + 1;
    // Walk back over a type expression including <...>
    let gd = 0;
    while (k >= 0) {
      const c = body[k];
      if (c === '>') gd++;
      else if (c === '<') gd--;
      else if (gd === 0 && /[\s;{}]/.test(c)) break;
      else if (gd === 0 && c === ',') break;
      k--;
    }
    const headStart = k + 1;
    // headStart..typeEnd is "modifiers + returnType"
    // Walk back further to include modifiers up to the previous statement/brace.
    let h = headStart - 1;
    while (h >= 0 && /\s/.test(body[h])) h--;
    while (h >= 0) {
      const c = body[h];
      if (c === ';' || c === '{' || c === '}') break;
      // include leading words (modifiers, annotations); stop at hard punctuation
      h--;
    }
    const fullHead = body.slice(h + 1, typeEnd).trim();
    // This is "modifiers + returnType". Skip if it has '=' (it's an assignment, not a method).
    if (/=/.test(fullHead)) continue;
    if (/[\(\)\[\]]/.test(fullHead)) continue;
    if (!fullHead) continue;
    const returnType = extractReturnType(fullHead);
    if (!returnType) continue;
    // Now find body braces
    const parenClose = matchParen(body, m.index + m[0].length - 1);
    if (parenClose < 0) continue;
    let i2 = parenClose + 1;
    while (i2 < body.length && /\s/.test(body[i2])) i2++;
    if (body.slice(i2, i2 + 6) === 'throws' && /\s/.test(body[i2 + 6] || '')) {
      while (i2 < body.length && body[i2] !== '{' && body[i2] !== ';') i2++;
    }
    if (body[i2] !== '{') continue;
    const endIdx = matchParen(body, i2);
    if (endIdx < 0) continue;
    const methodBody = body.slice(i2 + 1, endIdx);
    if (!perClass[methodName]) {
      perClass[methodName] = { returnType, body: methodBody };
    }
  }
  return perClass;
}

function findClassMethod(rec, methodName) {
  const all = _getClassMethods(rec);
  if (!all) return null;
  return all[methodName] || null;
}

/**
 * Try to infer the response data type by tracing one level into the service layer.
 * Looks for `<fieldName>.<methodName>(...)` in the controller body.
 *  - If the service method's interface return type is a parametric wrapper (e.g. APIResponse<X>), use X.
 *  - Otherwise look up <ServiceName>Impl.<methodName>'s body, and run detectResponseDataType on it.
 */
function traceThroughService(controllerBody, fields, registry, ctx) {
  if (!fields || !controllerBody) return null;
  for (const fieldName of Object.keys(fields)) {
    const callRe = new RegExp(`\\b${fieldName}\\s*\\.\\s*([A-Za-z_]\\w*)\\s*\\(`, 'g');
    let cm;
    while ((cm = callRe.exec(controllerBody)) !== null) {
      const methodName = cm[1];
      const fieldType = bareTypeName(fields[fieldName]).split('.').pop();
      const ifaceFqn = resolveSimpleName(fieldType, registry, ctx);
      if (!ifaceFqn) continue;
      const ifaceRec = registry.byFqn.get(ifaceFqn);
      if (!ifaceRec) continue;
      // Try the field's declared type first — works for both interfaces (with parametric
      // returns) and concrete `@Service`-annotated classes that contain the method body.
      const ifaceMethod = findClassMethod(ifaceRec, methodName);
      if (ifaceMethod) {
        const rt = cleanType(ifaceMethod.returnType);
        const wrapped = unwrapAndExtractData(rt);
        if (wrapped) return wrapped;
        if (ifaceRec.kind === 'class') {
          const inner = detectResponseDataType(ifaceMethod.body);
          if (inner.type) return inner.type;
        }
      }
      // Then try the impl class (FooService → FooServiceImpl)
      const implCandidates = [`${fieldType}Impl`, `${fieldType.replace(/Service$/, '')}ServiceImpl`];
      for (const cand of implCandidates) {
        const implFqn = resolveSimpleName(cand, registry, ctx);
        if (!implFqn) continue;
        const implRec = registry.byFqn.get(implFqn);
        if (!implRec) continue;
        const implMethod = findClassMethod(implRec, methodName);
        if (!implMethod) continue;
        const rt = cleanType(implMethod.returnType);
        const wrapped = unwrapAndExtractData(rt);
        if (wrapped) return wrapped;
        const inner = detectResponseDataType(implMethod.body);
        if (inner.type) return inner.type;
      }
    }
  }
  return null;
}

/** If a return type is a known wrapper with a type arg (APIResponse<X>), return X. Otherwise null. */
function unwrapAndExtractData(rt) {
  if (!rt) return null;
  // Strip ResponseEntity / Mono / Flux / Optional layers
  for (const w of ['ResponseEntity','Mono','Flux','Optional','Callable','Future','CompletableFuture']) {
    const re = new RegExp(`^${w}\\s*<\\s*([\\s\\S]+)\\s*>$`);
    const m = rt.match(re);
    if (m) { rt = m[1].trim(); break; }
  }
  const baseName = bareTypeName(rt).split('.').pop();
  if (isResponseWrapper(baseName)) {
    const args = outerTypeArgs(rt);
    if (args) {
      const parts = splitArgs(args);
      if (parts.length && parts[0]) return parts[0].trim();
    }
    return null; // raw wrapper, nothing to gain
  }
  // Bare DTO / Page<X> / List<X> — useful as-is
  return rt;
}

/** Extract the controller method's declared return type from the slice between annotations and method name. */
function extractReturnType(headRaw) {
  const MOD_RE = /^(public|protected|private|static|final|abstract|synchronized|default|native)\s+/;
  let s = headRaw.trim();
  while (MOD_RE.test(s)) s = s.replace(MOD_RE, '');
  // Strip dangling generic type params at the front of a generic method, e.g. `<T> ResponseEntity<T>`
  if (s.startsWith('<')) {
    const cl = s.indexOf('>');
    if (cl > 0) s = s.slice(cl + 1).trim();
  }
  return s.replace(/\s+/g, '').trim();
}

// ───────────────────────────────────────────────────────────────────────────
// Mapping & method extraction
// ───────────────────────────────────────────────────────────────────────────

const MAPPING_VERBS = {
  GetMapping: 'GET', PostMapping: 'POST', PutMapping: 'PUT',
  DeleteMapping: 'DELETE', PatchMapping: 'PATCH'
};

function pathFromAnnBody(body) {
  // value="/foo" or path="/foo" or just "/foo" (positional)
  return extractStringArg(body, 'value')
      ?? extractStringArg(body, 'path')
      ?? extractStringArg(body, null);
}

function extractMediaTypes(body, key) {
  if (!body) return null;
  // consumes = "application/json"  or  consumes = {"a","b"}
  const single = new RegExp(`\\b${key}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const m1 = body.match(single);
  if (m1) return [m1[1]];
  const arrRe = new RegExp(`\\b${key}\\s*=\\s*\\{([^}]*)\\}`);
  const m2 = body.match(arrRe);
  if (m2) {
    const out = [];
    const re = /"((?:[^"\\]|\\.)*)"/g; let mm;
    while ((mm = re.exec(m2[1])) !== null) out.push(mm[1]);
    return out.length ? out : null;
  }
  // MediaType constants — record the raw token so the renderer can show them.
  const mtRe = new RegExp(`\\b${key}\\s*=\\s*(MediaType\\.[A-Z_]+(?:_VALUE)?)`);
  const m3 = body.match(mtRe);
  if (m3) return [m3[1]];
  return null;
}

function extractMappingFromAnnotations(anns) {
  for (const a of anns) {
    const n = annName(a.raw);
    const body = annBody(a.raw);
    if (MAPPING_VERBS[n]) {
      return {
        method: MAPPING_VERBS[n],
        path: pathFromAnnBody(body) || '',
        consumes: extractMediaTypes(body, 'consumes'),
        produces: extractMediaTypes(body, 'produces')
      };
    }
    if (n === 'RequestMapping') {
      const p = pathFromAnnBody(body);
      const mm = body.match(/method\s*=\s*\{?\s*RequestMethod\.([A-Z]+)/);
      const method = mm ? mm[1] : 'GET';
      return {
        method,
        path: p || '',
        consumes: extractMediaTypes(body, 'consumes'),
        produces: extractMediaTypes(body, 'produces')
      };
    }
  }
  return null;
}

function operationSummary(anns) {
  for (const a of anns) {
    if (annName(a.raw) === 'Operation') {
      const body = annBody(a.raw);
      const s = extractStringArg(body, 'summary');
      if (s) return s;
    }
  }
  return null;
}

/** Are we likely a controller class? */
function controllerInfo(src) {
  const cls = src.match(/^(\s*@[A-Za-z_][\w.]*(?:\([^)]*\))?\s*)*(?:(?:public|protected|private|abstract|final|static|sealed|non-sealed)\s+)*\b(class|record)\s+([A-Za-z_]\w*)/m);
  if (!cls) return null;
  const head = src.slice(0, cls.index);
  const isController = /@(Rest)?Controller\b/.test(head) || /@(Rest)?Controller\b/.test(src.slice(0, cls.index + cls[0].length));
  if (!isController) return null;
  // Extract class-level @RequestMapping (base path)
  const classAnns = collectLeadingAnnotations(src, src.indexOf(cls[2] + ' ' + cls[3]));
  let basePath = '';
  for (const a of classAnns) {
    if (annName(a.raw) === 'RequestMapping') {
      const p = pathFromAnnBody(annBody(a.raw));
      if (p) basePath = p;
    }
  }
  // class-level @Tag for grouping name
  let tagName = null, tagDesc = null;
  for (const a of classAnns) {
    if (annName(a.raw) === 'Tag') {
      tagName = extractStringArg(annBody(a.raw), 'name');
      tagDesc = extractStringArg(annBody(a.raw), 'description');
    }
  }
  return { className: cls[3], basePath, tagName, tagDesc };
}

/** Find all method signatures and their preceding annotations within a class body. */
function findHandlers(src) {
  const handlers = [];
  // Find each @*Mapping anchor and then locate the method that follows.
  const anchorRe = /@(?:Get|Post|Put|Delete|Patch|Request)Mapping\b/g;
  let m;
  while ((m = anchorRe.exec(src)) !== null) {
    const anchor = m.index;
    // Find end of this annotation block (could be multiple stacked annotations)
    // Walk forward, skipping annotations and whitespace, until we hit a method declaration.
    let i = anchor;
    // step over the @*Mapping annotation (with optional args)
    while (i < src.length) {
      // skip @Annotation[(args)]
      while (src[i] === '@') {
        i++;
        while (i < src.length && /[A-Za-z0-9_.]/.test(src[i])) i++;
        if (src[i] === '(') {
          const cl = matchParen(src, i);
          if (cl < 0) { i = src.length; break; }
          i = cl + 1;
        }
        while (i < src.length && /\s/.test(src[i])) i++;
      }
      // expect modifiers + return type + name(
      // We'll look ahead for `name(`, capture from current position to that paren as "return + name", then signature
      // Skip generics like <T> and modifiers.
      // Find the next '(' that's at top level relative to current position
      let j = i;
      let depth = 0;
      while (j < src.length) {
        const c = src[j];
        if (c === '<') depth++;
        else if (c === '>') depth--;
        else if (c === '(' && depth === 0) break;
        else if (c === ';' || c === '{' || c === '}') { j = -1; break; }
        j++;
      }
      if (j < 0 || j >= src.length) break;
      // method name is the identifier just before '('
      let k = j - 1;
      while (k >= 0 && /\s/.test(src[k])) k--;
      let nameEnd = k + 1;
      while (k >= 0 && /[A-Za-z0-9_]/.test(src[k])) k--;
      const methodName = src.slice(k + 1, nameEnd);
      if (!methodName) break;
      // return type lives between end-of-annotations (i) and start-of-method-name (k+1)
      const headRaw = src.slice(i, k + 1).trim();
      const returnType = extractReturnType(headRaw);
      // params
      const cl = matchParen(src, j);
      if (cl < 0) break;
      const params = src.slice(j + 1, cl);
      // method body — find next '{' or ';'
      let b = cl + 1;
      while (b < src.length && /\s/.test(src[b])) b++;
      let body = '';
      let bodyEnd = b;
      if (src.slice(b, b + 6) === 'throws' && /\s/.test(src[b + 6] || '')) {
        // skip throws clause
        while (b < src.length && src[b] !== '{' && src[b] !== ';') b++;
      }
      // skip any 'throws X, Y' before body
      while (b < src.length && /[\sA-Za-z0-9_,]/.test(src[b]) && src[b] !== '{' && src[b] !== ';') b++;
      if (src[b] === '{') {
        const close = matchParen(src, b);
        if (close > 0) { body = src.slice(b + 1, close); bodyEnd = close + 1; }
      }
      // collect annotations by walking back from the position right before `public`/modifiers,
      // so the @*Mapping anchor itself is included.
      const annotations = collectLeadingAnnotations(src, i);
      handlers.push({
        annotations,
        methodName,
        returnType,
        params,
        body,
        bodyEnd
      });
      // continue scan from after body
      anchorRe.lastIndex = bodyEnd;
      break;
    }
  }
  return handlers;
}

// ───────────────────────────────────────────────────────────────────────────
// Per-handler analysis
// ───────────────────────────────────────────────────────────────────────────

/** simpleName + camel split → "Foo Bar Baz" */
function humanise(s) {
  if (!s) return '';
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PRIMITIVE_TYPES = new Set([
  'String','int','Integer','long','Long','short','Short','boolean','Boolean',
  'float','Float','double','Double','byte','Byte','char','Character','Object','BigDecimal',
  'LocalDate','LocalDateTime','LocalTime','OffsetDateTime','ZonedDateTime','Instant',
  'YearMonth','MonthDay','Date','UUID','URI','URL'
]);
const COLLECTION_BASES = new Set(['List','Set','Collection','Iterable','Map']);

/** Should we recurse into this type as a query-bound POJO? */
function isLikelyDto(simpleType) {
  if (!simpleType) return false;
  if (PRIMITIVE_TYPES.has(simpleType)) return false;
  if (COLLECTION_BASES.has(simpleType)) return false;
  if (/^(Pageable|Sort|HttpServletRequest|HttpServletResponse|MultipartFile|Authentication|Principal)$/.test(simpleType)) return false;
  // DTO-like name patterns
  return /(DTO|Dto|Filter|Request|Form|Params|Criteria|Query|Body)$/.test(simpleType)
      || /Request$/.test(simpleType);
}

function simpleType(t) {
  if (!t) return t;
  // strip generics + array/varargs
  return t.replace(/<.*$/, '').replace(/\[.*$/, '').replace(/\.\.\.$/, '').split('.').pop();
}

function describeType(type) {
  if (!type) return 'unknown';
  const cleaned = type.replace(/\s+/g, '');
  // Map common shapes to human strings
  const m = cleaned.match(/^(List|Set|Collection|Iterable)<([^>]+)>$/);
  if (m) return `${m[1].toLowerCase()}<${describeType(m[2])}>`;
  if (cleaned.match(/^Map<([^,]+),(.+)>$/)) {
    const mm = cleaned.match(/^Map<([^,]+),(.+)>$/);
    return `map<${describeType(mm[1])}, ${describeType(mm[2])}>`;
  }
  // unwrap generics for primitives
  const lc = cleaned.replace(/<.*>$/, '');
  if (PRIMITIVE_TYPES.has(lc)) return lc.toLowerCase();
  return cleaned;
}

/** Tags inferred from the path / params / annotations. */
function inferTags(method, path, params, headerNames, hasPageable, summary) {
  const tags = new Set();
  if (hasPageable) tags.add('paginated');
  if (/:export\b/.test(path) || /\bexport\b/i.test(summary || '')) tags.add('export');
  if (/:summary\b/.test(path) || /\bsummary\b/i.test(summary || '')) tags.add('summary');
  if (headerNames.some(h => /Time-Zone/i.test(h))) tags.add('time-zone header');
  if (method !== 'GET') tags.add(method.toLowerCase());
  if (path.includes('{') && params.length === 1) tags.add('lookup');
  return Array.from(tags);
}

function detectAuth(body) {
  if (!body) return null;
  // Spring Security
  const pre = body.match(/@PreAuthorize\(\s*"([^"]+)"/);
  if (pre) return `@PreAuthorize("${pre[1]}")`;
  const m = body.match(/requestMeta\.\b(isValid[A-Za-z_]*)\b\s*\(/);
  if (m) return m[1];
  if (/validateInstitutionScope|validateRosterScope|hasRole|hasAuthority/.test(body)) return 'custom';
  return null;
}

function detectResponseShape(body) {
  if (!body) return null;
  // .setData(<expr>) — record the expression
  const m = body.match(/\.setData\s*\(\s*([^)]+?)\s*\)\s*;/);
  if (m) return m[1].trim();
  // ResponseEntity.ok(<expr>)
  const m2 = body.match(/ResponseEntity\.(?:ok|status\([^)]+\))\s*\(?\s*\.?body?\s*\(\s*([^)]+)\s*\)/);
  if (m2) return m2[1].trim();
  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// Build the spec
// ───────────────────────────────────────────────────────────────────────────

function joinPath(base, sub) {
  if (!sub) return base || '/';
  if (!base) return sub;
  return (base.replace(/\/+$/, '') + '/' + sub.replace(/^\/+/, '')).replace(/\/{2,}/g, '/');
}

function readPomMeta(serviceDir) {
  const pom = readSafe(path.join(serviceDir, 'pom.xml'));
  const m = {};
  // Strip the <parent>...</parent> block to read the project's own coordinates separately.
  const parentBlock = pom.match(/<parent>[\s\S]*?<\/parent>/);
  const projectPom = parentBlock ? pom.replace(parentBlock[0], '') : pom;
  let ma;
  if ((ma = projectPom.match(/<artifactId>([^<]+)<\/artifactId>/))) m.artifactId = ma[1];
  if ((ma = projectPom.match(/<description>([^<]+)<\/description>/))) m.description = ma[1].trim();
  if ((ma = projectPom.match(/<version>([^<]+)<\/version>/))) m.version = ma[1];
  if ((ma = pom.match(/<java\.version>([^<]+)<\/java\.version>/))) m.javaVersion = ma[1];
  if (parentBlock) {
    const ver = parentBlock[0].match(/<version>([^<]+)<\/version>/);
    const aid = parentBlock[0].match(/<artifactId>([^<]+)<\/artifactId>/);
    if (aid && /spring-boot/.test(aid[1]) && ver) m.springBoot = ver[1];
  }
  return m;
}

function controllerToArea(className) {
  // Strip "Controller" / "RestController" suffix
  return humanise(className.replace(/(Rest)?Controller$/, ''));
}

function makeId(serviceId, idx) { return `${serviceId}-ep-${idx}`; }

/** Flatten an object schema into the legacy `[{name, type, format}]` shape (kept so the existing renderer keeps working until chunk 2). */
function legacyFieldsFromSchema(schema) {
  if (!schema) return null;
  if (schema.kind !== 'object' || !Array.isArray(schema.fields)) return null;
  return schema.fields.map(f => ({ name: f.name, type: f.type, format: f.format || null }));
}

/** Names of common response wrappers used in the codebase. The wrapper has a `data` slot we want to drill into. */
const RESPONSE_WRAPPERS = new Set(['ApiResponse','APIResponse','BaseResponse','Response','ResponseData','ResponseDTO']);

function isResponseWrapper(typeName) {
  if (!typeName) return false;
  return RESPONSE_WRAPPERS.has(typeName) || /Response(Data|DTO|Dto)?$/.test(typeName);
}

/**
 * Resolve a controller method's response-data slot.
 * Strategy:
 *  1. Unwrap ResponseEntity<T> from the declared return type.
 *  2. If T is a known wrapper (ApiResponse, etc.), look at the wrapper's first type arg.
 *  3. If still not concrete, sniff the method body for `.setData(<expr>)` and try to infer the static type of <expr>.
 *  4. Resolve the inferred type to a schema + synthesize a sample.
 *  5. Detect a Page<T> wrapper at the top level for `paginated:true`.
 */
function analyzeResponse(returnType, body, registry, ctx, traceCtx) {
  let rt = cleanType(returnType || '');
  let paginated = false;

  // Unwrap ResponseEntity / Mono / Flux / Optional / Callable / Future once
  for (const w of ['ResponseEntity','Mono','Flux','Optional','Callable','Future','CompletableFuture']) {
    const re = new RegExp(`^${w}\\s*<\\s*([\\s\\S]+)\\s*>$`);
    const m = rt.match(re);
    if (m) { rt = m[1].trim(); break; }
  }
  // Page<T> at the top level → paginated
  for (const w of ['Page','Slice','PageImpl']) {
    const re = new RegExp(`^${w}\\s*<\\s*([\\s\\S]+)\\s*>$`);
    const m = rt.match(re);
    if (m) { paginated = true; rt = m[1].trim(); break; }
  }

  // Identify the wrapper, if any, and a possible data type from its outer type args.
  let wrapperName = null;
  let dataType = null;
  let envelopeSchema = null;
  if (rt) {
    const baseName = bareTypeName(rt).split('.').pop();
    if (isResponseWrapper(baseName)) {
      wrapperName = baseName;
      const args = outerTypeArgs(rt);
      if (args) {
        const parts = splitArgs(args);
        if (parts.length) dataType = parts[0].trim();
      }
      // Resolve the envelope itself (one level) so the renderer can show the wrapper's fields.
      envelopeSchema = resolveSchema(rt, registry, ctx);
    } else if (rt) {
      // Bare return type — use it as the data type directly.
      dataType = rt;
    }
  }

  // Body sniff via .setData(...) when we still don't have a concrete data type
  const dataExpr = detectResponseDataType(body);
  if (!dataType && dataExpr.type) dataType = dataExpr.type;

  // Service-layer trace: when the controller does `<svc>.<method>(...)` and binds the
  // result directly without calling .setData, follow the call into the service interface
  // (parametric return) or impl (body sniff) to recover the data type.
  if (!dataType && traceCtx && traceCtx.fields) {
    const traced = traceThroughService(body, traceCtx.fields, registry, ctx);
    if (traced) dataType = traced;
  }

  // Note Page<T>/Slice<T> for the paginated tag, but DO NOT unwrap — let resolveSchema
  // produce the full envelope so synthesizeSample emits {content, totalElements, ...}.
  if (dataType && /^(?:Page|Slice|PageImpl)\s*</.test(dataType)) paginated = true;

  let resolved = null;
  let sample = null;
  if (dataType) {
    resolved = resolveSchema(dataType, registry, ctx);
    sample = synthesizeSample(resolved);
  }

  return {
    shape: dataExpr.rawExpr || dataType || null, // backward-compat field used by the existing renderer
    rawExpr: dataExpr.rawExpr || null,
    type: dataType || null,
    wrapper: wrapperName || null,
    envelope: envelopeSchema,
    resolved,
    sample,
    paginated
  };
}

function parseService(serviceDir, serviceId, registry) {
  const javaRoot = path.join(serviceDir, 'src', 'main', 'java');
  const javaFiles = walkJava(javaRoot);
  const meta = readPomMeta(serviceDir);
  // If the caller didn't supply a global registry, build a local one from this service alone.
  const reg = registry || buildRegistry(javaFiles);

  const areas = []; // { name, summary, sourceClass, endpoints[] }
  let epIdx = 0;
  let totalEndpoints = 0;
  const seenAreas = new Map();

  for (const file of javaFiles) {
    const raw = readSafe(file);
    if (!/@(Rest)?Controller\b/.test(raw)) continue;
    const src = stripComments(raw);
    const ctrl = controllerInfo(src);
    if (!ctrl) continue;
    // Capture the controller's package + imports for DTO resolution
    const pkgMatch = src.match(/^\s*package\s+([\w.]+)\s*;/m);
    const ctrlPackage = pkgMatch ? pkgMatch[1] : null;
    const imports = [];
    let ireg = /^\s*import\s+(?:static\s+)?([\w.*]+)\s*;/gm; let imatch;
    while ((imatch = ireg.exec(src)) !== null) imports.push(imatch[1]);
    const dtoCtx = { javaFiles, ctrlPackage, imports };

    // Capture controller-level fields so analyzeResponse can trace `<svc>.<method>(...)`.
    let ctrlFields = {};
    {
      // Find this controller's body in `src` so we can read its fields.
      const ctop = scanTopLevelTypes(src).find(t => t.simpleName === ctrl.className);
      if (ctop) ctrlFields = extractClassFields(ctop.body);
    }
    const traceCtx = { fields: ctrlFields };

    let areaName = ctrl.tagName || controllerToArea(ctrl.className);
    if (!seenAreas.has(areaName)) {
      seenAreas.set(areaName, { name: areaName, summary: ctrl.tagDesc || null, sourceClass: ctrl.className, file: path.relative(serviceDir, file), endpoints: [] });
      areas.push(seenAreas.get(areaName));
    }
    const area = seenAreas.get(areaName);

    const handlers = findHandlers(src);
    for (const h of handlers) {
      const mapping = extractMappingFromAnnotations(h.annotations);
      if (!mapping) continue;
      const fullPath = joinPath(ctrl.basePath, mapping.path);
      const summary = operationSummary(h.annotations) || humanise(h.methodName);

      // Parse params
      const paramList = h.params.trim() ? splitArgs(h.params).map(parseParam) : [];

      const pathParams = [];
      const headers = [];
      const queryParams = [];
      let requestBody = null;
      let hasPageable = false;
      const headerNames = [];

      for (const p of paramList) {
        const ann = p.annotations.map(a => a.name);
        const tSimple = simpleType(p.type);
        if (ann.includes('PathVariable')) {
          const a = p.annotations.find(x => x.name === 'PathVariable');
          const nm = extractStringArg(a.body, 'value') ?? extractStringArg(a.body, 'name') ?? extractStringArg(a.body, null) ?? p.name;
          pathParams.push({ name: nm, type: describeType(p.type), notes: '' });
        } else if (ann.includes('RequestHeader')) {
          const a = p.annotations.find(x => x.name === 'RequestHeader');
          const nm = extractStringArg(a.body, 'value') ?? extractStringArg(a.body, 'name') ?? extractStringArg(a.body, null) ?? p.name;
          const dft = extractStringArg(a.body, 'defaultValue');
          const req = extractBoolArg(a.body, 'required', dft == null);
          headers.push({ name: nm, required: req, default: dft, type: describeType(p.type), notes: '' });
          headerNames.push(nm);
        } else if (ann.includes('RequestParam')) {
          const a = p.annotations.find(x => x.name === 'RequestParam');
          const nm = extractStringArg(a.body, 'value') ?? extractStringArg(a.body, 'name') ?? extractStringArg(a.body, null) ?? p.name;
          const dft = extractStringArg(a.body, 'defaultValue');
          const req = extractBoolArg(a.body, 'required', dft == null);
          queryParams.push({ name: nm, type: describeType(p.type), default: dft, required: req, notes: '' });
        } else if (ann.includes('RequestBody')) {
          const cleaned = cleanType(p.type);
          const resolved = resolveSchema(cleaned, reg, dtoCtx);
          const sample = synthesizeSample(resolved);
          requestBody = {
            type: cleaned,
            fields: legacyFieldsFromSchema(resolved),
            resolved,
            sample
          };
        } else if (tSimple === 'Pageable' || tSimple === 'Sort') {
          hasPageable = true;
        } else if (isLikelyDto(tSimple)) {
          // bound query DTO
          const dto = lookupDto(tSimple, dtoCtx);
          if (dto && dto.length) {
            for (const f of dto) {
              queryParams.push({
                name: f.name,
                type: describeType(f.type),
                notes: f.format ? `Format \`${f.format}\`` : ''
              });
            }
          } else {
            queryParams.push({ name: `(${tSimple})`, type: tSimple, notes: 'Bound POJO — see source.' });
          }
        }
        // else: ignore (Authentication, Principal, request-scoped beans etc.)
      }

      const tags = inferTags(mapping.method, fullPath, paramList, headerNames, hasPageable, summary);
      const auth = detectAuth(h.body);

      // Response: combine the declared return type with the .setData(<expr>) inferred type to
      // produce a resolved schema for the data slot.
      const responseInfo = analyzeResponse(h.returnType, h.body, reg, dtoCtx, traceCtx);

      area.endpoints.push({
        id: makeId(serviceId, ++epIdx),
        method: mapping.method,
        path: fullPath || '/',
        summary,
        tags,
        pathParams,
        headers,
        queryParams,
        requestBody,
        hasPageable,
        auth,
        consumes: mapping.consumes || null,
        produces: mapping.produces || null,
        returnType: h.returnType || null,
        response: responseInfo
      });
      totalEndpoints++;
    }
  }

  // Drop areas with no endpoints (e.g. @ControllerAdvice)
  const populated = areas.filter(a => a.endpoints.length > 0);
  // Sort areas alphabetically for stable output, and endpoints by path
  populated.sort((a, b) => a.name.localeCompare(b.name));
  for (const a of populated) a.endpoints.sort((x, y) => (x.path + x.method).localeCompare(y.path + y.method));
  areas.length = 0; areas.push(...populated);

  return {
    service:       serviceId,
    serviceDir:    path.basename(serviceDir),
    artifactId:    meta.artifactId || null,
    description:   meta.description || null,
    javaVersion:   meta.javaVersion || null,
    springBoot:    meta.springBoot || null,
    totalEndpoints,
    totalAreas:    areas.length,
    areas
  };
}

// ───────────────────────────────────────────────────────────────────────────
// CLI
// ───────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const [, , dir, id, out] = process.argv;
  if (!dir || !id) {
    console.error('Usage: parse.js <service-dir> <service-id> [out.json]');
    process.exit(2);
  }
  const spec = parseService(dir, id);
  const json = JSON.stringify(spec, null, 2);
  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, json);
    console.error(`wrote ${out}  (${spec.totalEndpoints} endpoints across ${spec.totalAreas} areas)`);
  } else {
    process.stdout.write(json);
  }
}

module.exports = {
  parseService,
  buildRegistry,
  resolveSchema,
  synthesizeSample,
  walkJava
};
