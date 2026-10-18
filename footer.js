// ════════════════════════════════════════════════════════
// footer.js — Peu de pàgina comú (autoria i llicència)
//
// FITXER COMÚ: ve de step-quiz/step-quiz-commons i se sobreescriu sol.
// No l'editis aquí: canvia'l a step-quiz-commons (fitxers/footer.js) i, si
// és una cosa només d'aquest web, a comuns.json (bloc "config").
// ════════════════════════════════════════════════════════
(function () {
  // Mode embed (iframes del curs): no mostrem el footer per no saturar l'UI.
  try {
    if (new URLSearchParams(window.location.search).get('embed') === '1') return;
  } catch (e) { /* ignore */ }

  // Configuració d'aquest web (la hi posa sincronitza.py a partir de comuns.json):
  //   classe → classe CSS del <footer> (p. ex. 'pycat-footer')
  //   fix    → true: sempre visible a baix de tot (i reserva 44 px a .main);
  //            false: va al final de la pàgina (o a la darrera fila del
  //            simulador), així mai tapa el contingut ni el registre d'errors.
  var CONFIG = {"classe": "jscat-footer", "fix": true};
  var CLASSE = CONFIG.classe || 'cat-footer';

  // Detecta si estem dins de la carpeta curs/ o a l'arrel
  var isCurs = window.location.pathname.indexOf('/curs/') !== -1;
  var root = isCurs ? '../' : '';

  var style = document.createElement('style');
  style.textContent = (CONFIG.fix ? [
    '.' + CLASSE + ' {',
    '  position: fixed;',
    '  bottom: 0;',
    '  left: 0;',
    '  right: 0;',
    '  z-index: 200;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 8px;',
    '  padding: 6px 16px;',
    '  border-top: 1px solid #ddd;',
    '  font-family: system-ui, sans-serif;',
    '  font-size: 0.78rem;',
    '  color: #555;',
    '  text-align: center;',
    '  flex-wrap: wrap;',
    '  line-height: 1.4;',
    '  background: var(--bg, #fff);',
    '}',
    '.' + CLASSE + ' a {',
    '  color: inherit;',
    '}',
    // Padding-bottom al layout perquè el footer fix no tapi contingut
    '.main {',
    '  padding-bottom: 44px;',
    '}'
  ] : [
    '.' + CLASSE + ' {',
    '  flex-shrink: 0;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 6px;',
    '  padding: 4px 12px;',
    '  border-top: 1px solid var(--border, #ddd);',
    '  font-family: system-ui, sans-serif;',
    '  font-size: 0.78rem;',
    '  color: var(--muted, #555);',
    '  text-align: center;',
    '  flex-wrap: wrap;',
    '  line-height: 1.4;',
    '  background: var(--bg, #fff);',
    '}',
    '.' + CLASSE + ' a { color: inherit; }'
  ]).join('\n');
  document.head.appendChild(style);

  // HTML del footer — per canviar el text, canvia'l a step-quiz-commons.
  // Llicència: vegeu LICENSE i LLICENCIA.md (contingut CC BY-NC-SA 4.0, codi MIT).
  var footer = document.createElement('footer');
  footer.className = CLASSE;
  footer.innerHTML =
    '<span>© 2026 <strong>David Arso Civil</strong> · INS Miquel Tarradell.</span>' +
    '<span>Contingut: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>' +
    ' · Codi: <a href="' + root + 'LICENSE" target="_blank" rel="noopener">llicència MIT</a></span>';

  document.body.appendChild(footer);
})();
