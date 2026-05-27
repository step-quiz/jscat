// ════════════════════════════════════════════════════════
// domrunner.js — Execució del codi de l'alumne dins d'un iframe
//
// Per a la Part B del curs (capítols 9-12). A diferència del Worker:
//   - L'iframe SÍ té DOM (document, window, addEventListener, canvas...)
//   - NO podem matar bucles infinits amb terminate(); cal avisar
//   - El codi de l'alumne pot manipular la pàgina visualment
//
// API pública:
//   J.domInit(htmlBase)           — prepara l'iframe amb un HTML base
//   J.domRun(code, onDone)        — executa el codi de l'alumne
//   J.domRunAsync(code)           — Promise<output|null>
//   J.domReset()                  — recarrega l'iframe (estat net)
//
// Embolcallem tot dins una IIFE per evitar col·lisions de noms amb
// jsrunner.js (totes dues declaren _onDone i _currentOutput).
// ════════════════════════════════════════════════════════

(function() {

// ── Script que s'injecta a cada iframe ──────────────────
// Captura console.log/error i comunica amb el pare per postMessage.
const _IFRAME_BOOTSTRAP = `
<script>
(function() {
  function _fmt(arg) {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'function') return arg.toString();
    if (typeof arg === 'object') {
      try {
        const seen = new WeakSet();
        return JSON.stringify(arg, function(_, v) {
          if (typeof v === 'object' && v !== null) {
            if (seen.has(v)) return '[circular]';
            seen.add(v);
          }
          if (v && v.nodeName) return '<' + v.nodeName.toLowerCase() + '>';
          return v;
        }, 2);
      } catch (_) { return String(arg); }
    }
    return String(arg);
  }
  function _fmtArgs(args) {
    return Array.prototype.map.call(args, _fmt).join(' ');
  }
  function _send(type, data) {
    parent.postMessage(Object.assign({ __jscat: true, type: type }, data || {}), '*');
  }

  console.log   = function() { _send('stdout', { text: _fmtArgs(arguments) }); };
  console.info  = function() { _send('stdout', { text: _fmtArgs(arguments) }); };
  console.warn  = function() { _send('stderr', { text: _fmtArgs(arguments) }); };
  console.error = function() { _send('stderr', { text: _fmtArgs(arguments) }); };
  console.debug = function() { _send('stdout', { text: _fmtArgs(arguments) }); };

  window.addEventListener('error', function(e) {
    _send('error', { msg: (e.error && e.error.name ? e.error.name + ': ' : '') + (e.message || String(e)), line: e.lineno || null });
  });

  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'run') return;
    try {
      (0, eval)(e.data.code);
      _send('done', {});
    } catch (err) {
      let msg = err && err.message ? err.message : String(err);
      _send('error', {
        msg: (err && err.name ? err.name + ': ' : '') + msg,
        line: null
      });
    }
  });

  _send('ready', {});
})();
<\/script>
`;


// ── Estat intern (local a la IIFE) ───────────────────────
let _onDone        = null;
let _currentOutput = [];
let _msgHandler    = null;
let _htmlBase      = '<!DOCTYPE html><html><body></body></html>';
let _pendingCode   = null;


// ── Construir l'srcdoc complet ──────────────────────────
function _buildSrcdoc(htmlBase) {
  const lower = htmlBase.toLowerCase();
  const idx = lower.lastIndexOf('</body>');
  if (idx !== -1) {
    return htmlBase.slice(0, idx) + _IFRAME_BOOTSTRAP + htmlBase.slice(idx);
  }
  return htmlBase + _IFRAME_BOOTSTRAP;
}


// ── Inicialitza l'iframe amb un HTML base ───────────────
function domInit(htmlBase) {
  _htmlBase = htmlBase || _htmlBase;
  const iframe = document.getElementById('dom-iframe');
  if (!iframe) return;

  iframe.srcdoc = _buildSrcdoc(_htmlBase);

  if (_msgHandler) window.removeEventListener('message', _msgHandler);
  _msgHandler = function(e) {
    if (!e.data || !e.data.__jscat) return;
    if (e.source !== iframe.contentWindow) return;
    const h = _handlers[e.data.type];
    if (h) h(e.data);
  };
  window.addEventListener('message', _msgHandler);
}


// ── Consola petita del mode DOM ──────────────────────────
function _domConsolePush(text, type) {
  const el = document.getElementById('dom-console-output');
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'con-line ' + (type || 'out');
  line.textContent = (text === '' || text == null) ? '\u00a0' : text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function _domConsoleClear() {
  const el = document.getElementById('dom-console-output');
  if (el) el.innerHTML = '';
}


// ── Handlers de missatges des de l'iframe ───────────────
const _handlers = {
  ready: function() {
    if (_pendingCode) {
      const code = _pendingCode;
      _pendingCode = null;
      _doRun(code);
    }
  },
  stdout: function(d) {
    _domConsolePush(d.text, 'out');
    _currentOutput.push(d.text);
  },
  stderr: function(d) {
    _domConsolePush(d.text, 'err');
  },
  done: function() {
    J.state.running = false;
    _domConsolePush(J.t('log.done'), 'ok');
    J.setStateUI('done');
    _finish(_currentOutput.join('\n'));
  },
  error: function(d) {
    J.state.running = false;
    let msg = J.t('log.error') + ': ' + d.msg;
    if (d.line) msg += ' (línia ' + d.line + ')';
    _domConsolePush(msg, 'err');
    J.setStateUI('error');
    _finish(null);
  }
};


// ── Execució ─────────────────────────────────────────────
function _doRun(code) {
  const iframe = document.getElementById('dom-iframe');
  if (!iframe || !iframe.contentWindow) {
    _finish(null);
    return;
  }
  iframe.contentWindow.postMessage({ type: 'run', code: code }, '*');
}

function domRun(code, onDone) {
  // Recarreguem l'iframe sempre (estat net per a cada execució)
  domInit(_htmlBase);

  _currentOutput = [];
  _onDone = onDone || null;
  J.state.running = true;

  _domConsoleClear();
  J.setStateUI('running');
  _domConsolePush(J.t('log.running'), 'dim');

  _pendingCode = code;
}

function domRunAsync(code) {
  return new Promise(function(resolve) {
    domRun(code, function(output) { resolve(output); });
  });
}

function domReset() {
  domInit(_htmlBase);
  _domConsoleClear();
}


function _finish(output) {
  const cb = _onDone;
  _onDone = null;
  if (cb) cb(output);
}


// ── Exporta a J ──────────────────────────────────────────
J.domInit         = domInit;
J.domRun          = domRun;
J.domRunAsync     = domRunAsync;
J.domReset        = domReset;
J.domConsolePush  = _domConsolePush;
J.domConsoleClear = _domConsoleClear;

})();
