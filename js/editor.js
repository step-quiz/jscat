// ════════════════════════════════════════════════════════
// editor.js — Ressaltat sintàctic JavaScript, numeració de línies
//
// Adaptat de l'editor de PyCat. Canvis principals:
//   - Paraules clau i builtins de JS
//   - Comentaris: //  i  /* ... */  (poden ser multilínia)
//   - Strings: '...', "..." (una línia) i `...` (multilínia, template literals)
//   - Indentació: 2 espais (convenció JS)
// ════════════════════════════════════════════════════════


// ── Vocabulari JavaScript per al ressaltat ──────────────
const JS_KEYWORDS = new Set([
  'var', 'let', 'const',
  'if', 'else',
  'for', 'while', 'do',
  'break', 'continue',
  'switch', 'case', 'default',
  'function', 'return',
  'true', 'false', 'null', 'undefined',
  'new', 'this', 'typeof', 'instanceof', 'in', 'of',
  'try', 'catch', 'finally', 'throw',
  'class', 'extends', 'super', 'static',
  'import', 'export', 'from', 'as',
  'async', 'await', 'yield',
  'delete', 'void',
]);

const JS_BUILTINS = new Set([
  // Funcions globals i objectes nadius
  'console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'Date', 'RegExp', 'Error', 'Map', 'Set', 'Promise', 'Symbol',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'NaN', 'Infinity',
  // Funcions del navegador habituals als capítols
  'alert', 'prompt', 'confirm',
  // Mètodes habituals (es marquen com a built-in quan s'usen com a paraula)
  'log', 'error', 'warn', 'info',
  'length', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat',
  'join', 'split', 'indexOf', 'includes', 'reverse', 'sort', 'map', 'filter',
  'reduce', 'forEach', 'find', 'every', 'some',
  'toUpperCase', 'toLowerCase', 'trim', 'replace', 'startsWith', 'endsWith',
  'substring', 'charAt', 'charCodeAt',
  'keys', 'values', 'entries',
  'floor', 'ceil', 'round', 'abs', 'min', 'max', 'random', 'sqrt', 'pow',
  'stringify', 'parse',
  // DOM (per a Part B)
  'document', 'window', 'querySelector', 'querySelectorAll', 'getElementById',
  'addEventListener', 'createElement', 'appendChild', 'remove',
  'textContent', 'innerHTML', 'innerText', 'value', 'style',
  'requestAnimationFrame', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'getContext', 'fillRect', 'strokeRect', 'fillStyle', 'strokeStyle',
]);


// ── Tokenitza una línia per al ressaltat ─────────────────
// `commentState` indica si la línia comença dins d'un bloc /* */
// `templateState` indica si la línia comença dins d'una template literal `...`
// Retorna { html, commentState, templateState }
function tokenizeLine(line, commentState, templateState) {
  let out = '', i = 0;

  // ── Continuació d'un comentari /* */ d'una línia anterior ──
  if (commentState) {
    let s = '';
    while (i < line.length) {
      if (line[i] === '*' && i + 1 < line.length && line[i + 1] === '/') {
        s += '*/';
        i += 2;
        out += '<span class="hl-cm">' + J.escHtml(s) + '</span>';
        commentState = false;
        break;
      }
      s += line[i++];
    }
    if (commentState) {
      out += '<span class="hl-cm">' + J.escHtml(s) + '</span>';
      return { html: out, commentState: true, templateState: false };
    }
  }

  // ── Continuació d'una template literal `...` d'una línia anterior ──
  if (templateState) {
    let s = '';
    while (i < line.length) {
      if (line[i] === '\\' && i + 1 < line.length) {
        s += line[i++];
        s += line[i++];
        continue;
      }
      if (line[i] === '`') {
        s += '`';
        i++;
        out += '<span class="hl-str">' + J.escHtml(s) + '</span>';
        templateState = false;
        break;
      }
      s += line[i++];
    }
    if (templateState) {
      out += '<span class="hl-str">' + J.escHtml(s) + '</span>';
      return { html: out, commentState: false, templateState: true };
    }
  }

  // ── Tokenització normal ─────────────────────────────────
  while (i < line.length) {
    const c = line[i];

    // Comentari de línia //
    if (c === '/' && i + 1 < line.length && line[i + 1] === '/') {
      out += '<span class="hl-cm">' + J.escHtml(line.slice(i)) + '</span>';
      break;
    }

    // Comentari de bloc /* */
    if (c === '/' && i + 1 < line.length && line[i + 1] === '*') {
      let s = '/*';
      i += 2;
      let closed = false;
      while (i < line.length) {
        if (line[i] === '*' && i + 1 < line.length && line[i + 1] === '/') {
          s += '*/';
          i += 2;
          closed = true;
          break;
        }
        s += line[i++];
      }
      out += '<span class="hl-cm">' + J.escHtml(s) + '</span>';
      if (!closed) {
        // Continua a la línia següent
        return { html: out, commentState: true, templateState: false };
      }
      continue;
    }

    // Espai en blanc
    if (/\s/.test(c)) {
      let ws = '';
      while (i < line.length && /\s/.test(line[i])) ws += line[i++];
      out += J.escHtml(ws);
      continue;
    }

    // String amb cometes simples o dobles (una línia)
    if (c === '"' || c === "'") {
      const q = c;
      let s = c;
      i++;
      while (i < line.length && line[i] !== q) {
        if (line[i] === '\\' && i + 1 < line.length) {
          s += line[i++];
        }
        s += line[i++];
      }
      if (i < line.length) s += line[i++]; // tancament
      out += '<span class="hl-str">' + J.escHtml(s) + '</span>';
      continue;
    }

    // Template literal amb backticks (pot ser multilínia)
    if (c === '`') {
      let s = '`';
      i++;
      let closed = false;
      while (i < line.length) {
        if (line[i] === '\\' && i + 1 < line.length) {
          s += line[i++];
          s += line[i++];
          continue;
        }
        if (line[i] === '`') {
          s += '`';
          i++;
          closed = true;
          break;
        }
        s += line[i++];
      }
      out += '<span class="hl-str">' + J.escHtml(s) + '</span>';
      if (!closed) {
        return { html: out, commentState: false, templateState: true };
      }
      continue;
    }

    // Puntuació
    if ('()[]{};:,.=+-*/<>!%@&|^~?'.includes(c)) {
      out += '<span class="hl-br">' + J.escHtml(c) + '</span>';
      i++;
      continue;
    }

    // Número (incloent decimals)
    if (/[0-9]/.test(c)) {
      let n = '';
      let hasDot = false;
      while (i < line.length && /[0-9.]/.test(line[i])) {
        if (line[i] === '.') {
          if (hasDot) break;
          hasDot = true;
        }
        n += line[i++];
      }
      out += '<span class="hl-num">' + J.escHtml(n) + '</span>';
      continue;
    }

    // Identificador (paraules)
    if (/[a-zA-Z_$]/.test(c)) {
      let w = '';
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) w += line[i++];
      if (JS_KEYWORDS.has(w))      out += '<span class="hl-kw">' + J.escHtml(w) + '</span>';
      else if (JS_BUILTINS.has(w)) out += '<span class="hl-cmd">' + J.escHtml(w) + '</span>';
      else                         out += '<span class="hl-user">' + J.escHtml(w) + '</span>';
      continue;
    }

    // Caràcter no reconegut
    out += J.escHtml(line[i++]);
  }

  return { html: out, commentState: false, templateState: false };
}


// ── Ressaltat complet del codi ───────────────────────────
function highlightCode(code) {
  let commentState = false;
  let templateState = false;
  return code.split('\n').map(function(line, i) {
    const ln = i + 1;
    const result = tokenizeLine(line, commentState, templateState);
    commentState = result.commentState;
    templateState = result.templateState;
    return '<span class="code-line" id="cln-' + ln + '">' + result.html + '</span>';
  }).join('\n');
}


// ── Fons de línies (per marcar activa/error) ─────────────
function updateLineBg(numLines) {
  const bg = document.getElementById('line-bg');
  if (!bg) return;
  bg.innerHTML = Array.from({ length: numLines }, function(_, i) {
    return '<div class="lbg-row" id="lbg-' + (i + 1) + '"></div>';
  }).join('');
}


// ── Marcatge de línies ───────────────────────────────────
function highlightLine(n) {
  document.querySelectorAll('.lbg-row.active').forEach(function(el) { el.classList.remove('active'); });
  if (!n) return;
  const row = document.getElementById('lbg-' + n);
  if (row) row.classList.add('active');
}

function markErrorLine(n) {
  if (n) {
    const el = document.getElementById('lbg-' + n);
    if (el) el.classList.add('error');
  }
}

function clearLineMarks() {
  document.querySelectorAll('.lbg-row.active, .lbg-row.error')
    .forEach(function(el) { el.classList.remove('active', 'error'); });
}


// ── Actualitza editor (sync textarea → pre + line numbers) ──
function updateEditor() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('code-highlight');
  const ln = document.getElementById('line-numbers');
  if (!ta) return;

  const code  = ta.value;
  const lines = code.split('\n');

  if (hl) hl.innerHTML = highlightCode(code);
  if (ln) ln.innerHTML = lines.map(function(_, i) {
    return '<div class="ln">' + (i + 1) + '</div>';
  }).join('');

  updateLineBg(lines.length);

  if (!document.body.classList.contains('embed')) {
    try { localStorage.setItem(J.LS_KEY_CODE, code); } catch(_) {}
  }
}


// ── Inicialitza l'editor ─────────────────────────────────
function initEditor() {
  const ta = document.getElementById('code-editor');
  if (!ta) return;

  // Sync scroll
  ta.addEventListener('scroll', function() {
    const hl = document.getElementById('code-highlight');
    const bg = document.getElementById('line-bg');
    const ln = document.getElementById('line-numbers');
    if (hl) hl.scrollTop = ta.scrollTop;
    if (bg) bg.scrollTop = ta.scrollTop;
    if (ln) ln.scrollTop = ta.scrollTop;
    if (hl) hl.scrollLeft = ta.scrollLeft;
  });

  // Actualitza el ressaltat a cada input
  ta.addEventListener('input', updateEditor);

  // Tab / Shift+Tab — indentació amb 2 espais (convenció JS)
  ta.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    const acEl = document.getElementById('autocomplete');
    if (acEl && acEl.classList.contains('visible')) return;
    e.preventDefault();

    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const val   = ta.value;
    const INDENT = '  ';   // 2 espais

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    let lineEnd     = val.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = val.length;

    const block     = val.substring(lineStart, lineEnd);
    const lines     = block.split('\n');
    const multiLine = (start !== end && lines.length > 1);

    if (e.shiftKey) {
      // Desindenta
      let removed = 0;
      let firstRemoved = 0;
      const newLines = lines.map(function(ln, idx) {
        const m = ln.match(/^( {1,2})/);
        if (m) {
          const r = m[1].length;
          if (idx === 0) firstRemoved = r;
          removed += r;
          return ln.substring(r);
        }
        return ln;
      });
      const newBlock = newLines.join('\n');
      ta.value = val.substring(0, lineStart) + newBlock + val.substring(lineEnd);
      const newStart = Math.max(lineStart, start - firstRemoved);
      if (multiLine) {
        ta.selectionStart = newStart;
        ta.selectionEnd   = end - removed;
      } else {
        ta.selectionStart = ta.selectionEnd = newStart;
      }
    } else if (multiLine) {
      // Indenta tot el bloc
      const newLines = lines.map(function(ln) { return INDENT + ln; });
      const newBlock = newLines.join('\n');
      ta.value = val.substring(0, lineStart) + newBlock + val.substring(lineEnd);
      ta.selectionStart = start + INDENT.length;
      ta.selectionEnd   = end + (lines.length * INDENT.length);
    } else {
      // Tab normal
      ta.value = val.substring(0, start) + INDENT + val.substring(end);
      ta.selectionStart = ta.selectionEnd = start + INDENT.length;
    }

    updateEditor();
  });

  initAutocomplete(ta);
}


// ── Autocompletat ───────────────────────────────────────

function initAutocomplete(ta) {
  const ac = document.getElementById('autocomplete');
  if (!ac) return;

  let acItems = [];
  let acIndex = -1;

  function getVocab() {
    const vocab = [];
    JS_KEYWORDS.forEach(function(w) { vocab.push({ text: w, kind: 'kw' }); });
    JS_BUILTINS.forEach(function(w) { vocab.push({ text: w, kind: 'builtin' }); });
    return vocab;
  }

  function currentWord() {
    const before = ta.value.slice(0, ta.selectionStart);
    return (before.match(/[a-zA-Z_$][\w$]*$/) || [''])[0];
  }

  let _acCanvas = null;
  function caretScreenPos() {
    const rect  = ta.getBoundingClientRect();
    const style = window.getComputedStyle(ta);
    const lineH = parseFloat(style.lineHeight);
    const padT  = parseFloat(style.paddingTop);
    const padL  = parseFloat(style.paddingLeft);
    _acCanvas = _acCanvas || document.createElement('canvas');
    const ctx = _acCanvas.getContext('2d');
    ctx.font  = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
    const charW = ctx.measureText('m').width;
    const text  = ta.value.slice(0, ta.selectionStart);
    const lines = text.split('\n');
    const row   = lines.length - 1;
    const col   = lines[row].length;
    return {
      top:  rect.top  + padT + row * lineH - ta.scrollTop  + lineH + 2,
      left: rect.left + padL + col * charW - ta.scrollLeft,
    };
  }

  function renderAC() {
    ac.innerHTML = acItems.map(function(it, i) {
      return '<div class="ac-item' + (i === acIndex ? ' selected' : '') + '"'
        + ' data-idx="' + i + '" data-kind="' + it.kind + '"'
        + ' role="option" aria-selected="' + (i === acIndex) + '">' + it.text + '</div>';
    }).join('');
  }

  function showAC(items) {
    acItems = items;
    acIndex = 0;
    const pos = caretScreenPos();
    const dropH = Math.min(items.length * 27 + 4, 200);
    const top = (pos.top + dropH > window.innerHeight - 8)
      ? pos.top - dropH - parseFloat(window.getComputedStyle(ta).lineHeight) - 4
      : pos.top;
    ac.style.top  = top + 'px';
    ac.style.left = Math.max(4, pos.left) + 'px';
    renderAC();
    ac.classList.add('visible');
  }

  function hideAC() {
    ac.classList.remove('visible');
    acItems = [];
    acIndex = -1;
  }

  function acceptAC(idx) {
    const item = acItems[idx !== undefined ? idx : acIndex];
    if (!item) return;
    const word = currentWord();
    const pos  = ta.selectionStart;
    const pre  = ta.value.slice(0, pos - word.length);
    const post = ta.value.slice(pos);
    ta.value = pre + item.text + post;
    ta.selectionStart = ta.selectionEnd = pre.length + item.text.length;
    hideAC();
    updateEditor();
    if (!document.body.classList.contains('embed')) {
      try { localStorage.setItem(J.LS_KEY_CODE, ta.value); } catch(_) {}
    }
    ta.focus();
  }

  ta.addEventListener('input', function() {
    const word = currentWord();
    if (word.length < 2) { hideAC(); return; }
    const wordLower = word.toLowerCase();
    const matches = getVocab().filter(function(it) {
      return it.text.toLowerCase().startsWith(wordLower) && it.text.toLowerCase() !== wordLower;
    });
    if (matches.length) showAC(matches); else hideAC();
  });

  ta.addEventListener('keydown', function(e) {
    if (!ac.classList.contains('visible')) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        acIndex = Math.min(acIndex + 1, acItems.length - 1);
        renderAC();
        const sel = ac.querySelector('.selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
        break;
      case 'ArrowUp':
        e.preventDefault();
        acIndex = Math.max(acIndex - 1, 0);
        renderAC();
        const sel2 = ac.querySelector('.selected');
        if (sel2) sel2.scrollIntoView({ block: 'nearest' });
        break;
      case 'Enter':
      case 'Tab':
        if (acItems.length) { e.preventDefault(); acceptAC(); }
        break;
      case 'Escape':
        e.preventDefault();
        hideAC();
        break;
    }
  });

  ac.addEventListener('mousedown', function(e) {
    const item = e.target.closest('.ac-item');
    if (!item) return;
    e.preventDefault();
    acceptAC(+item.dataset.idx);
  });

  ta.addEventListener('blur', function() { setTimeout(hideAC, 150); });
  ta.addEventListener('click', hideAC);
  window.addEventListener('resize', hideAC);
}


// ── Exporta ──────────────────────────────────────────────
J.initEditor     = initEditor;
J.updateEditor   = updateEditor;
J.highlightLine  = highlightLine;
J.markErrorLine  = markErrorLine;
J.clearLineMarks = clearLineMarks;
