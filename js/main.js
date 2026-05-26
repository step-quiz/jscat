// ════════════════════════════════════════════════════════
// main.js — Inicialització: connecta els mòduls
//
// Paràmetres d'URL suportats:
//   ?embed=1         → amaga topbar (mode iframe)
//   ?code=BASE64     → codi inicial
//   ?readonly=1      → editor no editable
//   ?stdin=BASE64    → input predefinit per a prompt()
//   ?expected=BASE64 → output esperat (validació simple)
//   ?tests=BASE64    → JSON de test cases: [{stdin, expected}, ...]
//   ?testcode=BASE64 → codi JS afegit al final del codi de l'alumne
//   ?goalId=ID       → identificador del repte (per postMessage)
//   ?theme=light     → força mode clar
//   ?mode=dom        → mode pàgina viva (capítols 9-12)
//   ?html=BASE64     → HTML base per a l'iframe del mode dom
// ════════════════════════════════════════════════════════

(function init() {
  const S      = J.state;
  const params = new URLSearchParams(location.search);

  function dec(b64) {
    try { return decodeURIComponent(escape(atob(b64))); } catch { return null; }
  }

  // Detectem mode DOM ben aviat
  const isDomMode = params.get('mode') === 'dom';
  S.mode = isDomMode ? 'dom' : 'console';
  if (isDomMode) document.body.classList.add('dom-mode');

  // Origen segur per a postMessage
  J.parentOrigin = (() => {
    try {
      return document.referrer
        ? new URL(document.referrer).origin
        : window.location.origin;
    } catch { return window.location.origin; }
  })();

  // 0) Tema
  J.initTheme();

  // 0b) Obrir / Desar fitxers
  J.initFileActions();

  // 1) Editor
  J.initEditor();
  const ta = document.getElementById('code-editor');
  if (ta) {
    const useLS = !params.get('embed') && !params.get('code');
    const urlCode = params.get('code') ? dec(params.get('code')) : null;
    const saved = useLS ? localStorage.getItem(J.LS_KEY_CODE) : null;
    ta.value = urlCode || saved || J.DEFAULT_CODE;

    if (params.get('readonly') === '1') {
      ta.setAttribute('readonly', 'readonly');
      ta.style.cursor = 'default';
      document.body.classList.add('is-readonly');

      const toast = document.createElement('div');
      toast.className = 'readonly-toast';
      toast.textContent = J.t('ui.readonly');
      document.querySelector('.editor-inner').appendChild(toast);

      let hideTimer = null;
      ta.addEventListener('pointerdown', function() {
        clearTimeout(hideTimer);
        toast.classList.add('visible');
        hideTimer = setTimeout(function() { toast.classList.remove('visible'); }, 1400);
      });
    }

    J.updateEditor();
    setTimeout(() => J.updateEditor(), 50);
  }

  // 2) Paràmetres de validació
  S.goalId    = params.get('goalId') || '';
  S.testCode  = params.get('testcode') ? (dec(params.get('testcode')) || '') : '';

  const urlStdin = params.get('stdin') ? dec(params.get('stdin')) : null;

  if (params.get('tests')) {
    try {
      const parsed = JSON.parse(dec(params.get('tests')));
      S.testCases = parsed.map(tc => ({
        stdin:    tc.stdin !== undefined ? tc.stdin : (tc.input !== undefined ? tc.input : null),
        expected: tc.expected !== undefined ? tc.expected : ''
      }));
    } catch(_) {
      S.testCases = null;
    }
    S.freeStdin = null;
  } else if (params.get('expected')) {
    S.testCases = [{
      stdin:    urlStdin,
      expected: dec(params.get('expected')) || ''
    }];
    S.freeStdin = null;
  } else {
    S.testCases = null;
    S.freeStdin = urlStdin;
  }

  // 3) Inicialitza el runtime adequat
  if (isDomMode) {
    // En mode DOM, llegim l'HTML base (si no n'hi ha, n'usem un de mínim)
    const urlHtml = params.get('html') ? dec(params.get('html')) : null;
    const baseHtml = urlHtml || '<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;padding:16px;margin:0;}</style></head><body>\n<p>Pàgina d\'exemple</p>\n</body></html>';
    J.domInit(baseHtml);
  } else {
    J.jsInit();
  }

  // 4) Estat inicial
  J.setStateUI('idle');

  // 5) Mostra el panell stdin si el codi inicial usa prompt() i estem en mode lliure
  //    (només en mode consola; en mode dom el prompt és nadiu del navegador)
  if (!isDomMode && !S.testCases && !S.freeStdin) {
    const code = ta ? ta.value : '';
    if (/\bprompt\s*\(/.test(code)) {
      J.consoleShowStdinPanel();
    }
  }
})();
