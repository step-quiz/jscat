// ════════════════════════════════════════════════════════
// jsrunner.js — Gestió del Web Worker que executa JS
//
// Responsabilitats:
//   1. Crear el Worker
//   2. Executar codi i recopilar stdout/stderr
//   3. Gestionar timeout (bucles infinits → terminate)
//   4. Re-spawnar el worker després d'una mort
//
// API pública:
//   J.jsRun(code, stdin, onDone)        — executa, callback amb output|null
//   J.jsRunAsync(code, stdin)           — Promise<output|null>
//   J.jsKill()                          — mata i re-spawna
// ════════════════════════════════════════════════════════


// ── Estat ────────────────────────────────────────────────
let _currentOutput = [];
let _timeoutId     = null;
let _onDone        = null;


// ── Spawna un worker nou ─────────────────────────────────
function _spawnWorker() {
  const S = J.state;
  if (S.worker) return;

  S.worker = new Worker('js/jsworker.js');
  S.workerReady = false;

  S.worker.onmessage = function(e) {
    const type = e.data.type;
    if (_handlers[type]) _handlers[type](e.data);
  };

  S.worker.onerror = function(e) {
    J.consolePush('Error intern del worker: ' + (e.message || ''), 'err');
    J.setStateUI('error');
    _finish(null);
  };
}


// ── Handlers de missatges del worker ─────────────────────
const _handlers = {
  ready: function() {
    J.state.workerReady = true;
  },
  stdout: function(d) {
    J.consolePush(d.text, 'out');
    _currentOutput.push(d.text);
  },
  stderr: function(d) {
    J.consolePush(d.text, 'err');
  },
  done: function(d) {
    _clearTimeoutTimer();
    J.state.running = false;
    J.consolePush(J.t('log.done') + ' (' + d.elapsed + 'ms)', 'ok');
    J.setStateUI('done');
    _finish(_currentOutput.join('\n'));
  },
  error: function(d) {
    _clearTimeoutTimer();
    J.state.running = false;
    let msg = J.t('log.error') + ': ' + d.msg;
    if (d.line) msg += ' (línia ' + d.line + ')';
    J.consolePush(msg, 'err');
    if (d.line) J.markErrorLine(d.line);
    J.setStateUI('error');
    _finish(null);
  }
};


// ── Helpers de timeout ───────────────────────────────────
function _clearTimeoutTimer() {
  if (_timeoutId) { clearTimeout(_timeoutId); _timeoutId = null; }
}

function _onTimeout() {
  jsKill();
  J.consolePush(J.t('log.timeout'), 'err');
  J.setStateUI('error');
  // _finish ja s'ha cridat des de jsKill
}

function _finish(output) {
  const cb = _onDone;
  _onDone = null;   // nul·lifica ABANS de cridar per evitar doble invocació
  if (cb) cb(output);
}


// ── API pública ──────────────────────────────────────────

// Executa codi.
// stdin: string o null (línies separades per \n; cada prompt() en consumeix una)
// onDone(output): callback amb el text complet de stdout (o null si error/timeout)
function jsRun(code, stdin, onDone) {
  const S = J.state;

  if (!S.worker) _spawnWorker();

  // Si el worker encara no està llest, esperem
  if (!S.workerReady) {
    setTimeout(function() { jsRun(code, stdin, onDone); }, 30);
    return;
  }

  // Reset
  _currentOutput = [];
  _onDone = onDone || null;
  S.running = true;
  S.startTime = Date.now();

  J.clearLineMarks();
  J.setStateUI('running');
  J.consolePush(J.t('log.running'), 'dim');

  // Timeout de seguretat (bucles infinits)
  _timeoutId = setTimeout(_onTimeout, J.EXEC_TIMEOUT);

  // Envia al worker
  S.worker.postMessage({
    type:  'run',
    code:  code,
    stdin: stdin || ''
  });
}

function jsRunAsync(code, stdin) {
  return new Promise(function(resolve) {
    jsRun(code, stdin, function(output) { resolve(output); });
  });
}

// Mata el worker (per a bucles infinits o per re-iniciar)
function jsKill() {
  const S = J.state;
  _clearTimeoutTimer();
  if (S.worker) {
    S.worker.terminate();
    S.worker = null;
  }
  S.running = false;
  S.workerReady = false;
  _finish(null);
  // Spawna immediatament un de nou perquè la propera execució sigui ràpida
  _spawnWorker();
}


// ── Exporta ──────────────────────────────────────────────
J.jsRun      = jsRun;
J.jsRunAsync = jsRunAsync;
J.jsKill     = jsKill;
J.jsInit     = _spawnWorker;
