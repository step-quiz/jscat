// ════════════════════════════════════════════════════════
// ui.js — Interfície: botons, validació, tema, fitxers
//
// Flux de validació:
//   1. runProgram() construeix finalCode = userCode + testCode
//   2. Si hi ha testCases, executa el finalCode un cop per cada test case
//      (seqüencialment) amb el seu stdin, i compara amb expected.
//   3. Si no, fa una execució lliure (amb freeStdin o stdin del panell).
//   4. Un cop acaba, notifica el pare amb {success, results}.
// ════════════════════════════════════════════════════════


// ── Badge d'estat + mutació del botó ─────────────────────

function setStateUI(state) {
  J.state.currentState = state;

  const btn = document.getElementById('btn-run');
  if (btn) {
    const running = (state === 'running' || state === 'validating');
    btn.textContent = J.t(running ? 'ui.stop' : 'ui.run');
    btn.classList.toggle('p', !running);
    btn.classList.toggle('r', running);
  }
}


// ── Handler del botó principal ───────────────────────────
function handleRunClick() {
  const s = J.state.currentState;
  if (s === 'running' || s === 'validating') {
    stopProgram();
  } else {
    runProgram();
  }
}


// ── Construeix el codi final (codi de l'alumne + testCode) ──
function _buildFinalCode(userCode) {
  const tc = J.state.testCode || '';
  if (!tc) return userCode;
  return userCode + '\n\n// ── Tests ──\n' + tc;
}


// ── Detecta si el codi conté prompt() ─────────────────────
function _usesPrompt(code) {
  // Aproximat: ignora dins de comentaris i strings simples
  const lines = code.split('\n');
  let inBlockCm = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Treu blocs /* */
    while (inBlockCm) {
      const end = line.indexOf('*/');
      if (end === -1) { line = ''; break; }
      line = line.slice(end + 2);
      inBlockCm = false;
    }
    const blockStart = line.indexOf('/*');
    if (blockStart !== -1 && line.indexOf('*/', blockStart) === -1) {
      line = line.slice(0, blockStart);
      inBlockCm = true;
    }
    // Treu comentari de línia //
    const slashIdx = _findLineCommentStart(line);
    if (slashIdx >= 0) line = line.slice(0, slashIdx);
    // Cerca prompt(
    if (/\bprompt\s*\(/.test(line)) return true;
  }
  return false;
}

// Troba l'inici d'un comentari // ignorant les ocurrències dins strings
function _findLineCommentStart(line) {
  let inStr = false, strChar = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === strChar) inStr = false;
    } else {
      if (c === '"' || c === "'" || c === '`') { inStr = true; strChar = c; }
      else if (c === '/' && line[i + 1] === '/') return i;
    }
  }
  return -1;
}


// ── Gestió del panell stdin ──────────────────────────────
function _ensureStdinPanel(code) {
  const S = J.state;
  if (!S.testCases && !S.freeStdin && _usesPrompt(code)) {
    J.consoleShowStdinPanel();
  }
}


// ── Executa el programa ──────────────────────────────────
async function runProgram() {
  const S = J.state;
  const isDom = S.mode === 'dom';

  // Neteja: la consola correcta segons el mode
  if (isDom) {
    J.domConsoleClear();
    J.domReset();  // reinicia l'iframe per a un estat net
  } else {
    J.consoleClear();
    J.clearLineMarks();
  }

  const userCode = (document.getElementById('code-editor') || {}).value || '';
  if (!userCode.trim()) {
    (isDom ? J.domConsolePush : J.consolePush)('⚠ Escriu codi abans d\'executar.', 'dim');
    return;
  }

  _notifyClear();

  const finalCode = _buildFinalCode(userCode);

  // ── Cas 1: sense validació (simulador lliure) ──
  if (!S.testCases) {
    if (isDom) {
      await J.domRunAsync(finalCode);
    } else {
      let stdin = S.freeStdin || null;
      if (!stdin) {
        const panelStdin = J.consoleGetStdin();
        if (panelStdin) stdin = panelStdin;
      }
      J.consoleHideStdinPanel();
      await J.jsRunAsync(finalCode, stdin);
      _ensureStdinPanel(userCode);
    }
    return;
  }

  // ── Cas 2: amb validació (batch) ──
  setStateUI('validating');
  (isDom ? J.domConsolePush : J.consolePush)(J.t('log.validating'), 'dim');
  await _runBatchValidation(finalCode);
}


// ── Itera pels test cases en batch ──────────────────────
async function _runBatchValidation(finalCode) {
  const S = J.state;
  const isDom = S.mode === 'dom';
  const results = [];

  for (let i = 0; i < S.testCases.length; i++) {
    const tc = S.testCases[i];

    if (S.testCases.length > 1) {
      (isDom ? J.domConsolePush : J.consolePush)('── Test ' + (i + 1) + '/' + S.testCases.length + ' ──', 'dim');
    }

    // En mode dom no usem stdin; sempre passem el codi tal qual.
    const output = isDom
      ? await J.domRunAsync(finalCode)
      : await J.jsRunAsync(finalCode, tc.stdin || null);

    const passed = output !== null &&
                   _normalizeOutput(output) === _normalizeOutput(tc.expected || '');

    results.push({
      testIdx:  i,
      stdin:    tc.stdin || '',
      expected: tc.expected || '',
      actual:   output,
      passed:   passed
    });

    if (output === null) break;   // error → no continuem
  }

  _notifyResults(results);
}


// ── Atura el programa ────────────────────────────────────
function stopProgram() {
  if (J.state.mode === 'dom') {
    // En mode dom no podem matar un iframe bloquejat des de fora;
    // el millor que podem fer és recarregar-lo per a la propera execució.
    J.domReset();
    J.setStateUI('idle');
  } else {
    J.jsKill();
  }
}


// ── Neteja la consola ────────────────────────────────────
function resetConsole() {
  if (J.state.mode === 'dom') {
    J.domConsoleClear();
    J.domReset();
    J.setStateUI('idle');
    J.domConsolePush(J.t('log.reset'), 'dim');
    _notifyClear();
    return;
  }
  J.consoleClear();
  J.clearLineMarks();
  J.setStateUI('idle');
  J.consolePush(J.t('log.reset'), 'dim');
  _notifyClear();
  const code = (document.getElementById('code-editor') || {}).value || '';
  _ensureStdinPanel(code);
}


// ── Normalització d'output per a comparació ──────────────
function _normalizeOutput(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/\r\n/g, '\n').trim();
}


// ── Notificacions al pare (iframe) ───────────────────────
function _notifyClear() {
  if (!J.state.goalId) return;
  try {
    window.parent.postMessage({
      type: 'jscat-clear', goalId: J.state.goalId
    }, J.parentOrigin);
  } catch(_) {}
}

function _notifyResults(results) {
  if (!J.state.goalId) return;
  const allPassed = results.length > 0 && results.every(function(r) { return r.passed; });
  try {
    window.parent.postMessage({
      type:    'jscat-result',
      goalId:  J.state.goalId,
      success: allPassed,
      results: results
    }, J.parentOrigin);
  } catch(_) {}
}


// ── Tema clar/fosc ───────────────────────────────────────
const ICON_SUN  = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const ICON_MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function updateThemeBtn() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  const isLight = document.body.classList.contains('light');
  btn.innerHTML = isLight ? ICON_MOON : ICON_SUN;
  btn.title     = isLight ? 'Mode fosc' : 'Mode clar';
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem(J.LS_KEY_THEME, isLight ? 'light' : 'dark');
  updateThemeBtn();
}

function initTheme() {
  const saved = localStorage.getItem(J.LS_KEY_THEME);
  if (saved !== 'dark') document.body.classList.add('light');
  updateThemeBtn();
}


// ── Obrir / Desar fitxers .js ───────────────────────────

let _currentFileName = 'programa.js';

function initFileActions() {
  const btnOpen  = document.getElementById('btn-open');
  const btnSave  = document.getElementById('btn-save');
  const fileInput = document.getElementById('file-open-input');
  if (!btnOpen || !btnSave || !fileInput) return;

  btnOpen.addEventListener('click', function() {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    if (!file) return;
    _currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = function(e) {
      const ta = document.getElementById('code-editor');
      if (!ta) return;
      ta.value = e.target.result;
      J.updateEditor();
      if (!document.body.classList.contains('embed')) {
        try { localStorage.setItem(J.LS_KEY_CODE, ta.value); } catch(_) {}
      }
      ta.focus();
    };
    reader.readAsText(file);
  });

  btnSave.addEventListener('click', function() {
    const ta = document.getElementById('code-editor');
    if (!ta) return;
    const blob = new Blob([ta.value], { type: 'text/javascript;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = _currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}


// ── Exporta ──────────────────────────────────────────────
J.setStateUI     = setStateUI;
J.handleRunClick = handleRunClick;
J.initTheme      = initTheme;
J.initFileActions = initFileActions;
J.toggleTheme    = toggleTheme;
J.updateThemeBtn = updateThemeBtn;

window.handleRunClick = handleRunClick;
window.runProgram     = runProgram;
window.stopProgram    = stopProgram;
window.resetConsole   = resetConsole;
window.toggleTheme    = toggleTheme;
