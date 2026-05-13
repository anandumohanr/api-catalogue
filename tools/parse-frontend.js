#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Static parser for the Angular theme.
 *
 * Walks `src/environments/endpoints.ts`, every `*.service.ts`, every
 * `*.component.ts`, and every `*-routing.module.ts`. Emits a single JSON
 * blob describing:
 *
 *   - endpointMap        : { keyName → urlPattern } from endpoints.ts
 *   - services[]         : { class, file, calls: [{verb, endpointKey, line}] }
 *   - components[]       : { class, file, injects: [serviceClassName] }
 *   - routes[]           : { path, title, component, guards, file }
 *
 * Approach is regex-based — same playbook as the Java parser. Spring annotations
 * and Angular decorators are predictable enough that AST parsing buys little for
 * substantial complexity.
 *
 * Usage:  node parse-frontend.js <theme-dir> [out.json]
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────
// IO helpers
// ─────────────────────────────────────────────────────────────────────────

function walkTs(root, predicate) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    if (/\bnode_modules\b/.test(dir)) continue;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && predicate(e.name)) out.push(p);
    }
  }
  return out;
}
function readSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
function lineOf(src, idx) { return src.slice(0, idx).split('\n').length; }

// ─────────────────────────────────────────────────────────────────────────
// Comment / string-aware utilities
// ─────────────────────────────────────────────────────────────────────────

/** Strip TS line/block comments. Keeps strings intact. Output preserves length. */
function stripComments(src) {
  let out = '';
  let i = 0; const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') { out += ' '; i++; }
    } else if (c === '/' && d === '*') {
      out += '  '; i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' '; i++;
      }
      if (i < n) { out += '  '; i += 2; }
    } else if (c === '"' || c === "'" || c === '`') {
      const q = c; out += c; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\' && i + 1 < n) { out += src[i] + src[i + 1]; i += 2; continue; }
        if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
          // template-literal expression — preserve verbatim through the matching brace
          out += '${'; i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            const cc = src[i];
            if (cc === '{') depth++;
            else if (cc === '}') depth--;
            if (depth === 0) break;
            out += cc; i++;
          }
          if (i < n) { out += src[i]; i++; }
          continue;
        }
        out += src[i]; i++;
      }
      if (i < n) { out += src[i]; i++; }
    } else if (c === '/') {
      // Check for regex literal: / is regex when NOT preceded by ), ], or word/$ char.
      let j = out.length - 1;
      while (j >= 0 && (out[j] === ' ' || out[j] === '\t')) j--;
      const prev = j >= 0 ? out[j] : '';
      const isDiv = prev === ')' || prev === ']' || /[\w$]/.test(prev);
      if (!isDiv && d !== '/' && d !== '*') {
        // Regex literal — output verbatim (preserves length, prevents quote misparse)
        out += c; i++;  // opening /
        while (i < n && src[i] !== '/' && src[i] !== '\n') {
          if (src[i] === '\\' && i + 1 < n) { out += src[i] + src[i + 1]; i += 2; }
          else if (src[i] === '[') {
            out += src[i++];
            while (i < n && src[i] !== ']') {
              if (src[i] === '\\' && i + 1 < n) { out += src[i] + src[i + 1]; i += 2; }
              else { out += src[i++]; }
            }
            if (i < n) { out += src[i++]; }  // closing ]
          }
          else { out += src[i++]; }
        }
        if (i < n && src[i] === '/') { out += src[i++]; }  // closing /
        while (i < n && /[gimsuy]/.test(src[i])) { out += src[i++]; }  // flags
      } else { out += c; i++; }
    } else { out += c; i++; }
  }
  return out;
}

/** Find the matching closing bracket for an opening one at `open`. */
function matchBracket(src, open) {
  const oc = src[open];
  const cc = oc === '(' ? ')' : oc === '{' ? '}' : oc === '[' ? ']' : '';
  if (!cc) return -1;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') {
      depth--;
      if (depth === 0 && c === cc) return i;
    } else if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
    } else if (c === '/') {
      // Skip regex literals: / is a regex start when preceded by an operator-like token
      // (not by ), ], identifier char, or digit which would make it division).
      let j = i - 1;
      while (j >= 0 && (src[j] === ' ' || src[j] === '\t')) j--;
      const prev = j >= 0 ? src[j] : '';
      const isDiv = prev === ')' || prev === ']' || /[\w$]/.test(prev);
      if (!isDiv && src[i + 1] !== '/' && src[i + 1] !== '*') {
        i++; // skip opening /
        while (i < src.length && src[i] !== '/') {
          if (src[i] === '\\') i++;              // escaped char
          else if (src[i] === '[') {             // character class [...]
            i++;
            while (i < src.length && src[i] !== ']') { if (src[i] === '\\') i++; i++; }
          }
          i++;
        }
        // i now points at closing /; loop i++ will advance past it
      }
    }
  }
  return -1;
}

function isKeywordMethodName(name) {
  return /^(if|for|while|switch|catch|function|return|do|else|try|finally)$/.test(name);
}

function isTopLevelInClassBody(src, pos) {
  let depth = 0;
  for (let i = 0; i < pos; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < pos && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth = Math.max(0, depth - 1);
  }
  return depth === 0;
}

function collectClassMethods(body) {
  const methods = [];

  const add = (name, matchIndex, openBrace) => {
    if (!name || isKeywordMethodName(name) || !isTopLevelInClassBody(body, matchIndex)) return;
    const end = matchBracket(body, openBrace);
    if (end < 0) return;
    methods.push({ name, start: openBrace + 1, end });
  };

  const normalRe = /(?:^|[;\n}]\s*)(?:(?:public|private|protected|static|async|override)\s+)*([A-Za-z_]\w*)\s*(?:<[^>{}]*>)?\s*\([^()]*\)\s*(?::[^{};]+)?\s*\{/g;
  let m;
  while ((m = normalRe.exec(body)) !== null) {
    const open = normalRe.lastIndex - 1;
    add(m[1], m.index + m[0].indexOf(m[1]), open);
    normalRe.lastIndex = open + 1;
  }

  const arrowRe = /(?:^|[;\n}]\s*)(?:(?:public|private|protected|static|readonly|override)\s+)*([A-Za-z_]\w*)\s*=\s*(?:async\s*)?(?:\([^()]*\)|[A-Za-z_]\w*)\s*=>\s*\{/g;
  while ((m = arrowRe.exec(body)) !== null) {
    const open = arrowRe.lastIndex - 1;
    add(m[1], m.index + m[0].indexOf(m[1]), open);
    arrowRe.lastIndex = open + 1;
  }

  return methods.sort((a, b) => a.start - b.start);
}

function methodAt(methods, pos) {
  let best = null;
  for (const m of methods || []) {
    if (m.start <= pos && pos < m.end) {
      if (!best || m.start > best.start) best = m;
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────
// 1) endpoints.ts → keyMap
// ─────────────────────────────────────────────────────────────────────────

function parseEndpointsTs(themeDir) {
  const file = path.join(themeDir, 'src', 'environments', 'endpoints.ts');
  const raw = readSafe(file);
  if (!raw) return { file, map: {} };
  const src = stripComments(raw);
  const map = {};
  // export default { key: '...', "key": "...", key : '...' } — permissive whitespace
  const re = /["']?([A-Za-z_][\w]*)["']?\s*:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1], val = m[2];
    if (!val.startsWith('/')) continue;        // not a URL path
    if (key === 'apiEndPoint' || key === 'serverUrl') continue;
    if (map[key] && map[key] !== val) continue; // first one wins
    map[key] = val;
  }
  return { file: path.relative(themeDir, file), map };
}

// ─────────────────────────────────────────────────────────────────────────
// 2) *.service.ts → service descriptors
// ─────────────────────────────────────────────────────────────────────────

function parseServiceFile(file, themeDir, endpointMap) {
  const raw = readSafe(file);
  if (!/this\.http\.\w+\s*\(/.test(raw) && !/HttpClient/.test(raw)) return null;
  const src = stripComments(raw);
  const out = { file: path.relative(themeDir, file), classes: [] };

  const classRe = /\bexport\s+class\s+([A-Za-z_]\w*)\b[^{]*\{/g;
  let cm;
  while ((cm = classRe.exec(src)) !== null) {
    const className = cm[1];
    const bodyStart = cm.index + cm[0].length - 1;
    const bodyEnd = matchBracket(src, bodyStart);
    if (bodyEnd < 0) continue;
    const body = src.slice(bodyStart + 1, bodyEnd);
    const methods = collectClassMethods(body);
    const calls = [];

    const callRe = /this\.http\.(get|post|put|patch|delete|head|options|request)\s*(?:<[^>]*>)?\s*\(/g;
    let mm;
    while ((mm = callRe.exec(body)) !== null) {
      let verb = mm[1].toUpperCase();
      const openParen = mm.index + mm[0].length - 1;
      const closeParen = matchBracket(body, openParen);
      if (closeParen < 0) continue;

      // Smallest enclosing { ... } around this call — usually the method body.
      const enclosing = findEnclosingBlock(body, mm.index);
      const scopeText = enclosing ? enclosing.body : body;

      // 1. Inline references in the call's first argument
      let argBlob = body.slice(openParen + 1, closeParen);
      let urlExpr = firstArg(argBlob);

      // `http.request(verbLiteral, url, options)` — pull the verb from arg #1
      // and re-derive the URL expression from arg #2 so URL resolution works.
      if (verb === 'REQUEST') {
        const verbLit = stringLiteralValue(urlExpr.trim());
        if (verbLit) {
          verb = verbLit.toUpperCase();
          const afterFirst = argBlob.slice(urlExpr.length).replace(/^\s*,\s*/, '');
          urlExpr = firstArg(afterFirst);
          argBlob = afterFirst;
        }
      }
      let refs = collectEndpointRefs(urlExpr, endpointMap);

      // 2. If the arg is a bare identifier, resolve to its local assignment in scope.
      //    Also try the parent enclosing block when the variable is defined outside
      //    the immediate if/else/try block but within the same method body.
      if (refs.length === 0) {
        const ident = urlExpr.trim().match(/^([A-Za-z_]\w*)\s*$/);
        if (ident) {
          const locals = collectLocalAssignments(scopeText, endpointMap);
          const local = locals[ident[1]];
          if (local && local.length) {
            refs = local;
          } else if (enclosing) {
            const parentEnclosing = findEnclosingBlock(body, enclosing.start - 1);
            if (parentEnclosing) {
              const parentLocals = collectLocalAssignments(parentEnclosing.body, endpointMap);
              const parentLocal = parentLocals[ident[1]];
              if (parentLocal && parentLocal.length) refs = parentLocal;
            }
          }
        }
      }

      // 2b. `<localUrl> + <expr>` — common pattern where the URL is built by appending
      //     a path-variable at the call site. Resolve the local and extend its URL
      //     pattern by treating each `+`-separated tail part as either a literal or a
      //     `{name}` placeholder so the result lines up with the catalogued path.
      if (refs.length === 0) {
        const concat = urlExpr.trim().match(/^([A-Za-z_]\w*)\s*\+\s*(.*)$/s);
        if (concat) {
          const locals = collectLocalAssignments(scopeText, endpointMap);
          const local = locals[concat[1]];
          if (local && local.length) {
            const tail = splitTopLevel(concat[2], '+')
              .map(p => partToPattern(p.trim(), endpointMap))
              .join('');
            refs = local.map(r => ({
              ...r,
              urlPattern: r.urlPattern
                ? normaliseUrlPattern(r.urlPattern.replace(/\/+$/, '') + '/' + tail.replace(/^\/+/, ''))
                : null
            }));
          }
        }
      }

      // 3. Fallback: any endpoint refs anywhere in the enclosing scope. Acceptable
      //    overcount for methods with multiple http calls and multiple URL constants.
      if (refs.length === 0) refs = collectEndpointRefs(scopeText, endpointMap, false);

      const lineNum = lineOf(raw, mm.index + bodyStart + 1);
      const method = methodAt(methods, mm.index);
      if (refs.length === 0) {
        const literal = urlExpr.match(/^['"`]([^'"`]+)['"`]\s*$/);
        if (literal && literal[1].startsWith('/')) {
          calls.push({ verb, endpointKey: null, literalUrl: literal[1], line: lineNum, method: method?.name || null });
        } else {
          calls.push({ verb, endpointKey: null, expr: urlExpr.trim().slice(0, 120), line: lineNum, unresolved: true, method: method?.name || null });
        }
      } else {
        for (const r of refs) calls.push({ verb, endpointKey: r.key, transforms: r.transforms, urlPattern: r.urlPattern, line: lineNum, method: method?.name || null });
      }
    }

    out.classes.push({ class: className, calls, methods: methods.map(m => m.name) });
  }
  return out.classes.length ? out : null;
}

/** Find the smallest `{ ... }` block enclosing the given index. */
function findEnclosingBlock(src, pos) {
  let depth = 0;
  for (let i = pos; i >= 0; i--) {
    const c = src[i];
    if (c === '}') depth++;
    else if (c === '{') {
      if (depth === 0) {
        const close = matchBracket(src, i);
        if (close >= pos) return { start: i, end: close, body: src.slice(i + 1, close) };
        return null;
      }
      depth--;
    }
  }
  return null;
}

/**
 * Collect local variable assignments containing endpoint references.
 *   const|let|var <name> = ... environment.apiEndPoint.X ...;
 * Returns { name: [{ key, transforms }, ...] } so a later http call referencing
 * `<name>` as the URL can resolve to those keys.
 */
function readExpressionUntilStatementEnd(src, start) {
  let depth = 0;
  let i = start;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i += 2;
        else i++;
      }
      continue;
    }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') {
      if (depth > 0) depth--;
      else break;
    } else if (c === ';' && depth === 0) {
      break;
    } else if (c === '\n' && depth === 0) {
      const next = src.slice(i + 1).match(/^\s*([A-Za-z_]\w*|})/);
      if (next && /^(return|const|let|var|if|for|while|switch|})$/.test(next[1])) break;
    }
  }
  return { expr: src.slice(start, i).trim(), end: i };
}

function collectLocalAssignments(scopeText, endpointMap) {
  const locals = {};
  let m;
  const re = /\b(?:const|let|var)\s+([A-Za-z_]\w*)\s*(?::[^=;]+)?\s*=\s*/g;
  while ((m = re.exec(scopeText)) !== null) {
    const name = m[1];
    const read = readExpressionUntilStatementEnd(scopeText, re.lastIndex);
    const refs = collectEndpointRefs(read.expr, endpointMap);
    if (refs.length) locals[name] = (locals[name] || []).concat(refs);
    re.lastIndex = Math.max(re.lastIndex, read.end);
  }
  // Also: assignments to `this.<field>` — services sometimes hold the URL in a field.
  const fre = /this\.([A-Za-z_]\w*)\s*=\s*/g;
  while ((m = fre.exec(scopeText)) !== null) {
    const name = 'this.' + m[1];
    const read = readExpressionUntilStatementEnd(scopeText, fre.lastIndex);
    const refs = collectEndpointRefs(read.expr, endpointMap);
    if (refs.length) locals[name] = (locals[name] || []).concat(refs);
    fre.lastIndex = Math.max(fre.lastIndex, read.end);
  }
  // Plain reassignment inside conditionals:
  //   let url; if (...) { url = `${environment.apiEndPoint.x}/...`; }
  const are = /(?:^|[;{}\n])\s*([A-Za-z_]\w*)\s*=\s*/g;
  while ((m = are.exec(scopeText)) !== null) {
    const name = m[1];
    const read = readExpressionUntilStatementEnd(scopeText, are.lastIndex);
    const refs = collectEndpointRefs(read.expr, endpointMap);
    if (refs.length) locals[name] = (locals[name] || []).concat(refs);
    are.lastIndex = Math.max(are.lastIndex, read.end);
  }
  for (const [name, refs] of Object.entries(locals)) {
    const seen = new Set();
    locals[name] = refs.filter(r => {
      const key = `${r.key}|${r.urlPattern || ''}|${(r.transforms || []).join(',')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return locals;
}

/** Return the first comma-separated argument from a parenthesised arg list. */
function firstArg(s) {
  let depth = 0; let buf = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '<' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '>' || c === '}' || c === ']') depth--;
    else if (c === '"' || c === "'" || c === '`') {
      buf += c; i++;
      while (i < s.length && s[i] !== c) {
        if (s[i] === '\\') { buf += s[i] + s[i + 1]; i += 2; continue; }
        buf += s[i]; i++;
      }
      if (i < s.length) buf += s[i];
      continue;
    }
    if (c === ',' && depth === 0) break;
    buf += c;
  }
  return buf;
}

function stripOuterParens(s) {
  s = s.trim();
  while (s.startsWith('(') && matchBracket(s, 0) === s.length - 1) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function stringLiteralValue(s) {
  s = s.trim();
  const q = s[0];
  if ((q !== '"' && q !== "'" && q !== '`') || s[s.length - 1] !== q) return null;
  return s.slice(1, -1).replace(/\\(['"`\\])/g, '$1');
}

function placeholderName(expr) {
  let s = String(expr || '').trim()
    .replace(/\.toString\s*\(\s*\)/g, '')
    .replace(/\?.*$/, '');
  const fn = s.match(/^[A-Za-z_]\w*\(([^()]+)\)$/);
  if (fn) s = fn[1].trim();
  const parts = s.split('.');
  s = parts[parts.length - 1] || s;
  s = s.replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  return s || 'value';
}

function normaliseUrlPattern(s) {
  if (!s) return null;
  const queryIdx = s.indexOf('?');
  if (queryIdx >= 0) s = s.slice(0, queryIdx);
  s = s.replace(/([A-Za-z0-9}_])(\{[A-Za-z_]\w*\})/g, '$1/$2');
  s = s.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  s = s.replace(/(^|\/)#(?=\/|$|:)/g, '$1{id}');
  if (!s.startsWith('/')) s = '/' + s;
  return s;
}

function replacementPattern(arg, endpointMap) {
  const lit = stringLiteralValue(arg);
  if (lit != null) return lit;
  const ep = endpointRefToPattern(arg, endpointMap);
  if (ep != null) return ep;
  return `{${placeholderName(arg)}}`;
}

function endpointRefToPattern(part, endpointMap) {
  let s = stripOuterParens(part);
  const m = s.match(/^environment\.apiEndPoint\.([A-Za-z_]\w*)/);
  if (!m) return null;

  let base = (endpointMap && endpointMap[m[1]]) || null;
  if (!base) return null;

  let rest = s.slice(m[0].length).trim();
  while (rest.startsWith('.replace')) {
    const open = rest.indexOf('(');
    if (open < 0) break;
    const close = matchBracket(rest, open);
    if (close < 0) break;
    const args = splitTopLevel(rest.slice(open + 1, close), ',');
    if (args.length >= 2) {
      const from = stringLiteralValue(args[0]);
      if (from != null) {
        base = base.split(from).join(replacementPattern(args[1], endpointMap));
      }
    }
    rest = rest.slice(close + 1).trim();
  }
  return base;
}

function templateToPattern(body, endpointMap) {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '$' && body[i + 1] === '{') {
      let j = i + 2;
      let depth = 1;
      while (j < body.length && depth > 0) {
        if (body[j] === '{') depth++;
        else if (body[j] === '}') depth--;
        if (depth === 0) break;
        j++;
      }
      const inner = body.slice(i + 2, j).trim();
      const lit = stringLiteralValue(inner);
      const ep = endpointRefToPattern(inner, endpointMap);
      out += lit != null ? lit : ep != null ? ep : `{${placeholderName(inner)}}`;
      i = j;
    } else {
      out += body[i];
    }
  }
  return out;
}

function partToPattern(part, endpointMap) {
  let s = stripOuterParens(part);
  if (!s) return '';

  const lit = stringLiteralValue(s);
  if (lit != null) {
    if (s[0] === '`') return templateToPattern(lit, endpointMap);
    return lit;
  }

  const ep = endpointRefToPattern(s, endpointMap);
  if (ep != null) return ep;

  return `{${placeholderName(s)}}`;
}

function urlPatternFromExpression(expr, endpointMap) {
  if (!expr || !endpointMap) return null;
  const parts = splitTopLevel(expr, '+');
  const pattern = parts.map(p => partToPattern(p, endpointMap)).join('');
  return normaliseUrlPattern(pattern);
}

/**
 * Pull `environment.apiEndPoint.<key>` references out of an expression.
 * Notes:
 *  - `${environment.apiEndPoint.products}/${id}` → key: products, URL `/products/{id}`
 *  - `environment.apiEndPoint.x.replace('#', val)` → key: x, placeholder-substituted URL
 *  - bare `environment.apiEndPoint.x + foo` → key: x, URL `/x/{foo}`
 */
function collectEndpointRefs(expr, endpointMap, derivePattern = true) {
  const out = [];
  const seen = new Set();
  const re = /\benvironment\.apiEndPoint\.([A-Za-z_]\w*)/g;
  let m;
  const urlPattern = derivePattern && expr.length < 500 ? urlPatternFromExpression(expr, endpointMap) : null;
  while ((m = re.exec(expr)) !== null) {
    const key = m[1];
    if (seen.has(key)) continue;
    seen.add(key);
    const after = expr.slice(m.index + m[0].length);
    const transforms = [];
    if (/^\.replace\s*\(/.test(after)) transforms.push('replace');
    if (/^\s*\+/.test(after)) transforms.push('concat');
    if (/^\s*\}/.test(after)) transforms.push('template');
    out.push({ key, transforms, urlPattern });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// 3) *.component.ts (and guards/resolvers) → injection map
// ─────────────────────────────────────────────────────────────────────────

function findDecoratorArgsBefore(src, classIndex, name) {
  const before = src.slice(0, classIndex);
  const marker = '@' + name;
  const idx = before.lastIndexOf(marker);
  if (idx < 0) return null;
  const open = src.indexOf('(', idx + marker.length);
  if (open < 0 || open > classIndex) return null;
  const close = matchBracket(src, open);
  if (close < 0 || close > classIndex) return null;
  return src.slice(open + 1, close);
}

function parseComponentMeta(src, classIndex, file, themeDir) {
  const args = findDecoratorArgsBefore(src, classIndex, 'Component');
  if (!args) return {};
  const selector = args.match(/\bselector\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] || null;
  const templateUrl = args.match(/\btemplateUrl\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] || null;
  const inline = args.match(/\btemplate\s*:\s*`([\s\S]*?)`/)?.[1]
              || args.match(/\btemplate\s*:\s*['"]([\s\S]*?)['"]/)?.[1]
              || null;
  let template = inline;
  let templateFile = null;
  if (!template && templateUrl) {
    const abs = path.resolve(path.dirname(file), templateUrl);
    template = readSafe(abs);
    if (template) templateFile = path.relative(themeDir, abs);
  }
  return { selector, templateUrl, templateFile, template: template || null };
}

function collectServiceMethodCalls(body, serviceVars, raw, bodyStart) {
  const calls = [];
  const seen = new Set();
  for (const v of serviceVars || []) {
    const re = new RegExp(`\\bthis\\.${v.name}\\s*\\.\\s*([A-Za-z_]\\w*)\\s*\\(`, 'g');
    let m;
    while ((m = re.exec(body)) !== null) {
      const key = `${v.name}|${m[1]}|${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      calls.push({
        serviceVar: v.name,
        serviceClass: v.type,
        method: m[1],
        line: lineOf(raw, bodyStart + 1 + m.index)
      });
    }
  }
  return calls.sort((a, b) => a.line - b.line);
}

function parseComponentFile(file, themeDir, knownServices) {
  const raw = readSafe(file);
  if (!/\bclass\s+[A-Za-z_]\w*\b/.test(raw)) return null;
  const src = stripComments(raw);

  const classes = [];
  const classRe = /\bexport\s+class\s+([A-Za-z_]\w*)\b[^{]*\{/g;
  let cm;
  while ((cm = classRe.exec(src)) !== null) {
    const className = cm[1];
    const bodyStart = cm.index + cm[0].length - 1;
    const bodyEnd = matchBracket(src, bodyStart);
    if (bodyEnd < 0) continue;
    const body = src.slice(bodyStart + 1, bodyEnd);
    const meta = parseComponentMeta(src, cm.index, file, themeDir);

    // first constructor() in the class body
    const ctorMatch = body.match(/\bconstructor\s*\(/);
    let params = '';
    if (ctorMatch) {
      const ctorOpen = ctorMatch.index + ctorMatch[0].length - 1;
      const ctorClose = matchBracket(body, ctorOpen);
      if (ctorClose >= 0) params = body.slice(ctorOpen + 1, ctorClose);
    }

    // each parameter: [private|public|protected|readonly] name: Type
    const injects = [];
    const serviceVars = [];
    for (const p of splitTopLevel(params, ',')) {
      const parsed = parseCtorParam(p);
      if (parsed && knownServices.has(parsed.type)) {
        injects.push(parsed.type);
        serviceVars.push(parsed);
      }
    }
    const serviceCalls = collectServiceMethodCalls(body, serviceVars, raw, bodyStart);
    if (injects.length || meta.selector) classes.push({ class: className, injects, serviceVars, serviceCalls, ...meta });
  }
  return classes.length ? { file: path.relative(themeDir, file), classes } : null;
}

function splitTopLevel(s, sep) {
  const out = []; let depth = 0; let buf = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '<' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '>' || c === '}' || c === ']') depth--;
    else if (c === '"' || c === "'" || c === '`') {
      buf += c; i++;
      while (i < s.length && s[i] !== c) {
        if (s[i] === '\\') { buf += s[i] + s[i + 1]; i += 2; continue; }
        buf += s[i]; i++;
      }
      if (i < s.length) buf += s[i];
      continue;
    }
    if (c === sep && depth === 0) { out.push(buf.trim()); buf = ''; continue; }
    buf += c;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function parseCtorParam(decl) {
  // strip decorators (`@Inject(...) `) and modifiers
  let s = decl.replace(/^@\w+\([^)]*\)\s*/, '').trim();
  s = s.replace(/^(?:(?:public|private|protected|readonly|static)\s+)+/, '').trim();
  // pattern: name: Type[<...>] [= default]
  const m = s.match(/^([A-Za-z_]\w*)\??\s*:\s*([A-Za-z_]\w*)/);
  return m ? { name: m[1], type: m[2] } : null;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findChildSelectors(template, selectors) {
  const out = [];
  if (!template) return out;
  for (const selector of selectors) {
    if (!selector || selector.startsWith('[') || selector.includes(',')) continue;
    const re = new RegExp(`<\\s*${escapeRegExp(selector)}(?:\\s|>|/)`, 'i');
    if (re.test(template)) out.push(selector);
  }
  return out.sort();
}

// ─────────────────────────────────────────────────────────────────────────
// 4) *-routing.module.ts → flat route list with full paths
// ─────────────────────────────────────────────────────────────────────────

function parseRoutingModule(file, themeDir) {
  const raw = readSafe(file);
  if (!/Routes?\s*=|\bRoute\.withShell\s*\(\s*\[/.test(raw) && !/RouterModule\.forChild/.test(raw)) return null;
  const src = stripComments(raw);

  // find the routes array literal: anchored at `Routes = [` OR `Route.withShell([`
  const arrays = [];
  const reA = /\bRoutes\s*=\s*\[/g;
  const reB = /\bRoute\.withShell\s*\(\s*\[/g;
  for (const re of [reA, reB]) {
    let m;
    while ((m = re.exec(src)) !== null) {
      const open = src.indexOf('[', m.index + m[0].length - 1);
      if (open < 0) continue;
      const close = matchBracket(src, open);
      if (close < 0) continue;
      arrays.push(src.slice(open + 1, close));
    }
  }

  const routes = [];
  for (const arr of arrays) {
    extractRouteObjects(arr).forEach(r => routes.push(r));
  }
  return { file: path.relative(themeDir, file), routes };
}

/** Walk top-level `{...}` objects in a routes array text and pull route metadata. */
function extractRouteObjects(arrText) {
  const out = [];
  let i = 0;
  while (i < arrText.length) {
    if (arrText[i] === '{') {
      const close = matchBracket(arrText, i);
      if (close < 0) break;
      const inner = arrText.slice(i + 1, close);
      out.push(parseRouteObject(inner));
      i = close + 1;
    } else { i++; }
  }
  return out;
}

function parseRouteObject(s) {
  const r = { path: null, component: null, loadChildren: null, redirectTo: null, guards: [], title: null, children: [] };
  // path
  const p = s.match(/\bpath\s*:\s*['"`]([^'"`]*)['"`]/); if (p) r.path = p[1];
  // component
  const c = s.match(/\bcomponent\s*:\s*([A-Za-z_]\w*)/); if (c) r.component = c[1];
  // loadChildren — string form OR () => import('...').then(m => m.X)
  const lcStr = s.match(/\bloadChildren\s*:\s*['"`]([^'"`]+)['"`]/);
  if (lcStr) r.loadChildren = lcStr[1];
  if (!r.loadChildren) {
    const lcImp = s.match(/loadChildren\s*:\s*\([^)]*\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.then\([^)]*=>\s*[A-Za-z_]+\.([A-Za-z_]\w*)/);
    if (lcImp) r.loadChildren = lcImp[1] + '#' + lcImp[2];
  }
  // redirectTo
  const rt = s.match(/\bredirectTo\s*:\s*['"`]([^'"`]*)['"`]/); if (rt) r.redirectTo = rt[1];
  // canActivate
  const ca = s.match(/\bcanActivate\s*:\s*\[([^\]]*)\]/);
  if (ca) r.guards = ca[1].split(',').map(g => g.trim()).filter(Boolean);
  // data.title
  const dt = s.match(/\bdata\s*:\s*\{[^}]*\btitle\s*:\s*['"`]([^'"`]*)['"`]/);
  if (dt) r.title = dt[1];
  // children
  const ch = s.match(/\bchildren\s*:\s*\[/);
  if (ch) {
    const open = s.indexOf('[', ch.index + ch[0].length - 1);
    const close = matchBracket(s, open);
    if (close > 0) r.children = extractRouteObjects(s.slice(open + 1, close));
  }
  return r;
}

// ─────────────────────────────────────────────────────────────────────────
// loadChildren resolution
// ─────────────────────────────────────────────────────────────────────────

/**
 * Resolve a loadChildren string `"app/admin/admin.module#AdminModule"` (or the
 * import-syntax variant) to an actual `*-routing.module.ts` file path.
 * Strategy: look at the module file, follow the *-routing.module.ts sibling.
 */
function resolveLoadChildren(loadChildren, themeDir) {
  if (!loadChildren) return null;
  // path before '#'
  const [modPath] = loadChildren.split('#');
  // normalise: strip leading "./", trailing extension, any leading "app/"
  let p = modPath.replace(/\\/g, '/').replace(/\.ts$/, '');
  // theme src/app prefix expectations
  if (p.startsWith('app/')) p = 'src/' + p;
  if (!p.startsWith('src/')) p = 'src/app/' + p.replace(/^\.\//, '');
  // try direct match first
  const candidates = [
    p + '.ts',
    p.replace(/\.module$/, '-routing.module') + '.ts',
    p.replace(/\.module$/, '.routing.module') + '.ts',
    p.replace(/\.module$/, '.routing') + '.ts',
  ];
  for (const c of candidates) {
    const abs = path.join(themeDir, c);
    if (fs.existsSync(abs)) {
      // if it's a *.module.ts, look up the routing-module sibling import
      if (/\.module\.ts$/.test(abs) && !/-routing|\.routing/.test(abs)) {
        const sibling = findRoutingSibling(abs);
        if (sibling) return sibling;
      }
      return abs;
    }
  }
  return null;
}

function findRoutingSibling(moduleFile) {
  const dir = path.dirname(moduleFile);
  const stems = ['', '-routing', '.routing'];
  const baseName = path.basename(moduleFile, '.ts').replace(/\.module$/, '');
  for (const stem of stems) {
    for (const suffix of [`${baseName}${stem}.module.ts`, `${baseName}${stem}.ts`]) {
      const f = path.join(dir, suffix);
      if (fs.existsSync(f) && /-routing|\.routing/.test(suffix)) return f;
    }
  }
  // common convention
  const f = path.join(dir, baseName + '-routing.module.ts');
  if (fs.existsSync(f)) return f;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Route flattening — recursively expand lazy-loaded children
// ─────────────────────────────────────────────────────────────────────────

function flattenRoutes(rootRoutes, rootFile, themeDir, visited = new Set()) {
  const out = [];
  const recurse = (routes, prefix, file, activeComponents = []) => {
    for (const r of routes) {
      if (r.redirectTo != null && !r.component && !r.loadChildren) continue;
      const segment = (r.path == null ? '' : r.path).replace(/^\/+|\/+$/g, '');
      const fullPath = '/' + [prefix, segment].filter(Boolean).join('/');
      const cleanPath = fullPath.replace(/\/{2,}/g, '/').replace(/^\/$/, '/') || '/';
      const componentChain = r.component ? [...activeComponents, r.component] : activeComponents;

      if (r.component) {
        out.push({
          path: cleanPath,
          title: r.title,
          component: r.component,
          componentChain,
          guards: r.guards || [],
          file
        });
      }
      if (r.loadChildren) {
        const childRoutingFile = resolveLoadChildren(r.loadChildren, themeDir);
        if (childRoutingFile && !visited.has(childRoutingFile)) {
          visited.add(childRoutingFile);
          const child = parseRoutingModule(childRoutingFile, themeDir);
          if (child) recurse(child.routes, [prefix, segment].filter(Boolean).join('/'), child.file, componentChain);
        }
      }
      if (r.children && r.children.length) {
        recurse(r.children, [prefix, segment].filter(Boolean).join('/'), file, componentChain);
      }
    }
  };
  recurse(rootRoutes, '', rootFile);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Top-level parseTheme()
// ─────────────────────────────────────────────────────────────────────────

function parseTheme(themeDir) {
  const srcRoot = path.join(themeDir, 'src');
  // Collect files
  const allTs = walkTs(srcRoot, n => n.endsWith('.ts') && !n.endsWith('.spec.ts'));
  const serviceFiles  = allTs.filter(f => /\.service\.ts$/.test(f));
  const routingFiles  = allTs.filter(f => /-routing\.module\.ts$|\.routing\.module\.ts$|app-routing\.module\.ts$/.test(f));
  const componentLike = allTs.filter(f => /\.component\.ts$|\.guard\.ts$|\.resolver\.ts$/.test(f));

  // 1) endpoints.ts
  const endpoints = parseEndpointsTs(themeDir);

  // 2) services
  const services = [];
  const serviceClassNames = new Set();
  for (const f of serviceFiles) {
    const svc = parseServiceFile(f, themeDir, endpoints.map);
    if (!svc) continue;
    services.push(svc);
    for (const cls of svc.classes) serviceClassNames.add(cls.class);
  }

  // 3) components / guards / resolvers — capture injects of known services
  const components = [];
  for (const f of componentLike) {
    const cmp = parseComponentFile(f, themeDir, serviceClassNames);
    if (cmp) components.push(cmp);
  }
  const knownSelectors = [];
  for (const cmp of components) {
    for (const cls of cmp.classes) {
      if (cls.selector) knownSelectors.push(cls.selector);
    }
  }
  for (const cmp of components) {
    for (const cls of cmp.classes) {
      cls.childSelectors = findChildSelectors(cls.template, knownSelectors.filter(s => s !== cls.selector));
      delete cls.template;
    }
  }

  // 4) routes. Start at the root app-routing.module.ts and recursively follow loadChildren.
  const rootRoutingFile = path.join(srcRoot, 'app', 'app-routing.module.ts');
  const visited = new Set([rootRoutingFile]);
  let routes = [];
  if (fs.existsSync(rootRoutingFile)) {
    const root = parseRoutingModule(rootRoutingFile, themeDir);
    if (root) routes = flattenRoutes(root.routes, root.file, themeDir, visited);
  }

  // Also fold in any *-routing modules we never reached via loadChildren — flatten with their own filename's path
  for (const f of routingFiles) {
    if (visited.has(f)) continue;
    const r = parseRoutingModule(f, themeDir);
    if (!r) continue;
    visited.add(f);
    // top-level prefix unknown — use the file path as a hint
    const moduleHint = path.relative(srcRoot, f).replace(/\.ts$/, '').replace(/-routing.*$/, '');
    const prefix = moduleHint.replace(/^app\//, '').replace(/\/[^/]+$/, '');
    const flattened = flattenRoutes(r.routes, r.file, themeDir, visited);
    for (const rt of flattened) {
      // these were missed by lazy-load chain. Keep them but flag the ambiguity.
      out_pushOrphan(rt, prefix);
      routes.push({ ...rt, _orphan: true, _moduleHint: moduleHint });
    }
  }

  return { endpoints, services, components, routes };
}

function out_pushOrphan() { /* no-op; placeholder for future logging */ }

// ─────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const [, , themeDir, out] = process.argv;
  if (!themeDir) {
    console.error('Usage: parse-frontend.js <theme-dir> [out.json]');
    process.exit(2);
  }
  const t0 = Date.now();
  const result = parseTheme(themeDir);
  const summary = {
    endpoints: Object.keys(result.endpoints.map).length,
    services:  result.services.length,
    serviceClasses: result.services.reduce((n, s) => n + s.classes.length, 0),
    httpCalls: result.services.reduce((n, s) => n + s.classes.reduce((m, c) => m + c.calls.length, 0), 0),
    components: result.components.length,
    componentClasses: result.components.reduce((n, c) => n + c.classes.length, 0),
    routes: result.routes.length,
    routesWithComponent: result.routes.filter(r => r.component).length,
    elapsedMs: Date.now() - t0
  };
  console.error(`[parse-frontend] ${JSON.stringify(summary)}`);
  const json = JSON.stringify(result, null, 2);
  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, json);
    console.error(`[parse-frontend] wrote ${out}  (${(json.length / 1024).toFixed(1)}KB)`);
  } else {
    process.stdout.write(json);
  }
}

module.exports = { parseTheme };
