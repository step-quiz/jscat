// ════════════════════════════════════════════════════════
// jsworker.js — Web Worker per a l'execució del codi de l'alumne
//
// Vist del cantó del pare:
//   El pare envia: { type: 'run', code: '...', stdin: '...' }
//   El worker emet: { type: 'stdout', text }
//                   { type: 'stderr', text }
//                   { type: 'done', elapsed }
//                   { type: 'error', msg, line }
//
// Característiques:
//   - Executa el codi amb (0, eval)() per evitar afegir cap context propi
//   - Captura console.log/info/warn/error i ho redirigeix al pare
//   - Sobreescriu prompt() perquè llegeixi d'un stdin pre-carregat
//     (una línia per crida; quan s'esgota, retorna null com el navegador)
//   - Sobreescriu alert() perquè vagi a stdout
//   - Captura errors no atrapats (window.onerror dins worker = self.onerror)
// ════════════════════════════════════════════════════════


// ── Funció de format (com fa console.log al navegador) ──
function _fmt(arg) {
  if (arg === undefined) return 'undefined';
  if (arg === null)      return 'null';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'function') return arg.toString();
  if (typeof arg === 'object') {
    try {
      // Cerca repeticions per evitar JSON.stringify infinit
      const seen = new WeakSet();
      return JSON.stringify(arg, function(_, v) {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[circular]';
          seen.add(v);
        }
        return v;
      }, 2);
    } catch (_) {
      return String(arg);
    }
  }
  return String(arg);
}

function _fmtArgs(args) {
  return Array.prototype.map.call(args, _fmt).join(' ');
}


// ── Captura de console.* ────────────────────────────────
const _send = (type, data) => postMessage(Object.assign({ type: type }, data || {}));

console.log   = function() { _send('stdout', { text: _fmtArgs(arguments) }); };
console.info  = function() { _send('stdout', { text: _fmtArgs(arguments) }); };
console.warn  = function() { _send('stderr', { text: _fmtArgs(arguments) }); };
console.error = function() { _send('stderr', { text: _fmtArgs(arguments) }); };
console.debug = function() { _send('stdout', { text: _fmtArgs(arguments) }); };


// ── alert() també va a la consola ────────────────────────
self.alert = function(msg) {
  _send('stdout', { text: _fmt(msg) });
};


// ── prompt() llegeix d'un stdin pre-carregat ────────────
// Cada crida consumeix una línia. Si s'esgota, retorna null
// (mateix comportament que prompt() cancel·lat al navegador).
let _stdinLines = [];
let _stdinIdx   = 0;

self.prompt = function(msg) {
  // Imprimeix el missatge del prompt() com a sortida visual (system)
  // perquè l'alumne vegi què demanava. Marcat com a `system: true`
  // perquè el sistema de validació l'ignori (només es valida el que l'alumne
  // imprimeix explícitament amb console.log).
  if (msg !== undefined && msg !== null && msg !== '') {
    _send('stdout', { text: _fmt(msg), system: true });
  }
  if (_stdinIdx >= _stdinLines.length) return null;
  const line = _stdinLines[_stdinIdx++];
  // Eco visual del que s'ha llegit, també marcat com a system
  _send('stdout', { text: '> ' + line, system: true });
  return line;
};

// confirm() — llegeix una línia: 'true'/'false' o 's'/'n'.
// Igual que prompt(), els missatges visuals són system (no validables).
self.confirm = function(msg) {
  if (msg !== undefined && msg !== null && msg !== '') {
    _send('stdout', { text: _fmt(msg), system: true });
  }
  if (_stdinIdx >= _stdinLines.length) return false;
  const line = _stdinLines[_stdinIdx++].trim().toLowerCase();
  const result = (line === 'true' || line === 's' || line === 'sí' || line === 'si' || line === 'yes' || line === 'y');
  _send('stdout', { text: '> ' + (result ? 'sí' : 'no'), system: true });
  return result;
};


// ── Errors no atrapats (incloent SyntaxError d'eval) ────
// Notice: per a eval(), els errors es propaguen com a try/catch normal,
// així que el handler aquí és per errors asíncrons o casos rars.
self.addEventListener('error', function(e) {
  _send('error', { msg: e.message || String(e), line: e.lineno || null });
});
self.addEventListener('unhandledrejection', function(e) {
  const reason = e.reason && e.reason.message ? e.reason.message : String(e.reason);
  _send('error', { msg: 'Promesa no atrapada: ' + reason, line: null });
});


// ── Handler principal: rep el codi i l'executa ──────────
self.onmessage = function(e) {
  const d = e.data || {};
  if (d.type !== 'run') return;

  // Reset stdin
  _stdinLines = (d.stdin || '').split('\n');
  // Si l'stdin acaba en \n, l'split deixa un '' final — l'eliminem
  if (_stdinLines.length && _stdinLines[_stdinLines.length - 1] === '') {
    _stdinLines.pop();
  }
  _stdinIdx = 0;

  const t0 = (self.performance && self.performance.now) ? self.performance.now() : Date.now();
  try {
    // (0, eval)(code) executa en context global del worker, no en el local d'aquest handler.
    // Així `let`/`const` declarats al codi de l'alumne no col·lisionen amb les nostres variables.
    (0, eval)(d.code);
    const elapsed = Math.round(((self.performance && self.performance.now) ? self.performance.now() : Date.now()) - t0);
    _send('done', { elapsed: elapsed });
  } catch (err) {
    // Errors síncrons d'eval (SyntaxError, ReferenceError, etc.)
    let msg = err && err.message ? err.message : String(err);
    let line = null;
    // Mirem si l'stack ens dóna pista de la línia
    if (err && err.stack) {
      // Format típic: "...at eval (eval at...:LINE:COL)"
      const m = err.stack.match(/<anonymous>:(\d+):/);
      if (m) line = parseInt(m[1], 10);
    }
    _send('error', { msg: (err && err.name ? err.name + ': ' : '') + msg, line: line });
  }
};


// ── Senyala que el worker està llest ────────────────────
_send('ready', {});
