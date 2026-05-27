// ════════════════════════════════════════════════════════
// domrunner.js — Execució del codi de l'alumne dins d'un iframe
//
// Per a la Part B del curs (capítols 9-12).
//
// API pública:
//   J.domInit(htmlBase)           — prepara l'iframe amb un HTML base
//   J.domRun(code, onDone)        — executa el codi de l'alumne
//   J.domRunAsync(code)           — Promise<output|null>
//   J.domReset()                  — recarrega l'iframe (estat net)
//
// Flux d'execució:
//   1. domRun() reassigna iframe.srcdoc i registra iframe.onload
//   2. Quan l'iframe carrega (event 'load'), el bootstrap interior
//      ja s'ha executat i ha sobreescrit console.* i addEventListener('message',...)
//   3. Llavors enviem el codi via postMessage('run', code) a iframe.contentWindow
//   4. El bootstrap fa (0,eval)(code) i ens retorna stdout/done/error
//
// Embolcallem tot dins una IIFE per evitar col·lisions amb jsrunner.js.
// ════════════════════════════════════════════════════════

(function() {

// ── Script que s'injecta a cada iframe ──────────────────
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
})();
<\/script>
`;


// ── Estat intern ────────────────────────────────────────
let _onDone        = null;
let _currentOutput = [];
let _msgHandler    = null;
let _htmlBase      = '<!DOCTYPE html><html><body></body></html>';


// ── Construir l'srcdoc complet ──────────────────────────
function _buildSrcdoc(htmlBase) {
  const lower = htmlBase.toLowerCase();
  const idx = lower.lastIndexOf('</body>');
  if (idx !== -1) {
    return htmlBase.slice(0, idx) + _IFRAME_BOOTSTRAP + htmlBase.slice(idx);
  }
  return htmlBase + _IFRAME_BOOTSTRAP;
}


// ── Listener de missatges (instal·lat un cop) ───────────
function _installListener() {
  if (_msgHandler) return;
  _msgHandler = function(e) {
    // No filtrem per e.source: l'iframe té sandbox sense allow-same-origin,
    // així que el seu origin és opaque i e.source no és comparable de forma
    // fiable. La marca __jscat ja és prou específica.
    if (!e.data || !e.data.__jscat) return;
    const h = _handlers[e.data.type];
    if (h) h(e.data);
  };
  window.addEventListener('message', _msgHandler);
}


// ── Inicialitza l'iframe amb un HTML base (sense executar codi) ──
function domInit(htmlBase) {
  _htmlBase = htmlBase || _htmlBase;
  _installListener();
  const iframe = document.getElementById('dom-iframe');
  if (!iframe) return;
  iframe.onload = null;   // no executem codi a la càrrega inicial
  iframe.srcdoc = _buildSrcdoc(_htmlBase);
}


// ── Consola petita del mode DOM ─────────────────────────
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


// ── Execució: recarrega l'iframe i envia el codi a 'load' ──
function domRun(code, onDone) {
  _installListener();

  const iframe = document.getElementById('dom-iframe');
  if (!iframe) {
    if (onDone) onDone(null);
    return;
  }

  _currentOutput = [];
  _onDone = onDone || null;
  J.state.running = true;

  _domConsoleClear();
  J.setStateUI('running');
  _domConsolePush(J.t('log.running'), 'dim');

  // Quan l'iframe estigui carregat (el bootstrap ja s'haurà executat),
  // enviem el codi de l'alumne. Aquesta és la peça clau: l'event 'load'
  // és fiable, no com el missatge 'ready' que podia perdre's.
  iframe.onload = function() {
    iframe.onload = null;
    try {
      iframe.contentWindow.postMessage({ type: 'run', code: code }, '*');
    } catch (err) {
      _domConsolePush('Error en enviar codi: ' + err.message, 'err');
      J.setStateUI('error');
      _finish(null);
    }
  };

  // Reassignem el srcdoc per forçar una recàrrega (i un 'load' nou)
  iframe.srcdoc = _buildSrcdoc(_htmlBase);
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
