// ════════════════════════════════════════════════════════
// kbd-accessory.js — Barra de tecles per a pantalles tàctils
//
// FITXER COMÚ: ve de step-quiz/step-quiz-commons i se sobreescriu sol.
// No l'editis aquí: canvia'l a step-quiz-commons (fitxers/kbd-accessory.js)
// i, si és una cosa només d'aquest web (les tecles), a comuns.json.
//
// Una fila de botons amb els símbols difícils d'escriure amb el teclat
// virtual (i, si el curs ho vol, paraules i accions). Els botons no treuen
// el focus de l'editor (mousedown → preventDefault) i escriuen amb
// execCommand('insertText'), de manera que Ctrl+Z / desfer funciona.
// Treballa sobre el <textarea id="code-editor"> de la pàgina.
//
// Dues disposicions (config.disposicio):
//   'sota' → a sota de .editor-wrap, sempre visible si el punter principal
//            és tàctil (pointer: coarse); mai en exemples no editables.
//            Es desplaça en horitzontal. (KarelCat)
//   'fixa' → fixa a baix de la pantalla, només mentre l'editor té el focus,
//            en qualsevol dispositiu amb capacitat tàctil; mai en mode embed
//            (body.embed) ni en pantalles amples amb ratolí. (PyCat, JSCat)
// ════════════════════════════════════════════════════════
(function () {
  // Configuració d'aquest web (la hi posa sincronitza.py a partir de comuns.json):
  //   disposicio → 'sota' o 'fixa'
  //   api        → nom de l'objecte global de l'editor que té editText(ta, text)
  //                i, si cal, indentSelection(ta) / dedentSelection(ta)
  //                (p. ex. 'K' a KarelCat, 'P' a PyCat). Si no n'hi ha, s'escriu
  //                amb una funció pròpia equivalent.
  //   tecles     → llista: "x" (escriu x), null (separador) o
  //                { "label": "if", "text": "if ", "title": "…", "accio": "indenta" | "desindenta" }
  var CONFIG = {"disposicio": "fixa", "tecles": ["(", ")", "{", "}", "[", "]", null, ";", ".", "\"", "'", "`", null, "=", "+", "-", "*", "/", "%", null, "<", ">", "!", "&", "|", null, {"label": "=>", "text": "=> "}]};
  var FIXA = CONFIG.disposicio === 'fixa';
  var API = objecteGlobal(CONFIG.api);
  var TECLES = CONFIG.tecles || [];

  if (FIXA) {
    var isTouch = ('ontouchstart' in window) ||
                  (navigator.maxTouchPoints > 0) ||
                  (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if (!isTouch) return;
    if (document.body.classList.contains('embed')) return;
  } else if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) {
    return;
  }

  var ta = document.getElementById('code-editor');
  if (!ta) return;
  var wrap = document.querySelector('.editor-wrap');
  if (!FIXA && (!wrap || ta.readOnly)) return;
  if (CONFIG.api && !(API && API.editText)) return;

  // Escriu a la posició del cursor conservant l'historial de desfer
  // (la mateixa lògica que editText de KarelCat i PyCat).
  function editText(text) {
    if (API && API.editText) { API.editText(ta, text); return; }
    var from = ta.selectionStart, to = ta.selectionEnd;
    ta.focus();
    ta.setSelectionRange(from, to);
    var ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
    if (!ok) {
      var v = ta.value;
      ta.value = v.slice(0, from) + text + v.slice(to);
      ta.selectionStart = ta.selectionEnd = from + text.length;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // L'objecte de l'editor pot ser a window (window.K = …) o ser una constant
  // global d'un altre <script> (const P = …), que no penja de window.
  function objecteGlobal(nom) {
    if (!nom || !/^[A-Za-z_$][\w$]*$/.test(nom)) return null;
    if (window[nom]) return window[nom];
    try { return Function('return typeof ' + nom + " !== 'undefined' ? " + nom + ' : null;')(); }
    catch (e) { return null; }
  }

  var ACCIONS = {
    indenta: function () { if (API && API.indentSelection) API.indentSelection(ta); },
    desindenta: function () { if (API && API.dedentSelection) API.dedentSelection(ta); }
  };

  // ── Estils (variables de color del curs: --surface, --border, --bg, --text, --accent…) ──
  var style = document.createElement('style');
  style.textContent = (FIXA ? [
    '.kbd-bar--fixa {',
    /* z-index per sobre del peu de pàgina fix (footer.js, 200): abans el peu la tapava */
    '  position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;',
    '  background: var(--surface); border-top: 1px solid var(--border);',
    '  transform: translateY(100%); transition: transform 0.15s ease;',  /* amagada fins que l'editor té el focus */
    '  padding-bottom: env(safe-area-inset-bottom, 0);',                  /* iPhones amb barra de gestos */
    '}',
    '.kbd-bar--fixa.visible { transform: translateY(0); }',
    '.kbd-bar--fixa .kbd-bar__scroll {',
    '  display: flex; align-items: center; gap: 4px; padding: 5px 8px;',
    '  overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scrollbar-width: none;',
    '}',
    '.kbd-bar--fixa .kbd-bar__scroll::-webkit-scrollbar { display: none; }',
    '.kbd-bar--fixa .kbd-bar__btn {',
    '  flex-shrink: 0; font-family: var(--mono); font-size: 0.82rem; min-width: 34px; height: 32px;',
    '  display: inline-flex; align-items: center; justify-content: center;',
    '  border: 1px solid var(--border); border-radius: 5px; background: var(--bg); color: var(--text);',
    '  cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none;',
    '}',
    '.kbd-bar--fixa .kbd-bar__btn--word { padding: 0 8px; }',
    '.kbd-bar--fixa .kbd-bar__btn:active { background: var(--accent); color: #fff; border-color: var(--accent); }',
    '.kbd-bar--fixa .kbd-bar__sep { flex-shrink: 0; width: 1px; height: 20px; background: var(--border); margin: 0 2px; }',
    /* Mentre la barra és visible, reserva-li espai perquè no tapi la consola ni l'editor */
    'body.kbd-active .main { padding-bottom: 42px; }',
    'body.embed .kbd-bar--fixa { display: none; }',
    '@media (min-width: 701px) and (hover: hover) { .kbd-bar--fixa { display: none; } }'
  ] : [
    '.kbd-bar--sota {',
    '  display: flex; align-items: center; gap: 6px; padding: 5px 8px;',
    '  overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none;',
    '  background: var(--surface); border-top: 1px solid var(--border); flex-shrink: 0;',
    '}',
    '.kbd-bar--sota::-webkit-scrollbar { display: none; }',
    '.kbd-bar--sota .kbd-bar__btn {',
    '  flex: 0 0 auto; min-width: 40px; height: 40px; padding: 0 10px;',
    '  font-family: var(--mono); font-size: 17px; font-weight: 700;',
    '  color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: 6px;',
    '  cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: rgba(0,0,0,0.08);',
    '}',
    '.kbd-bar--sota .kbd-bar__btn--word { font-size: 14px; font-weight: 400; }',
    '.kbd-bar--sota .kbd-bar__btn:active { background: var(--accent-dim); border-color: var(--accent); }',
    '.kbd-bar--sota .kbd-bar__sep { flex: 0 0 1px; align-self: stretch; margin: 4px 2px; background: var(--border); }'
  ]).join('\n');
  document.head.appendChild(style);

  // ── DOM ──
  var bar = document.createElement('div');
  bar.className = 'kbd-bar kbd-bar--' + (FIXA ? 'fixa' : 'sota');
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Tecles per escriure codi');
  var fila = bar;
  if (FIXA) {
    fila = document.createElement('div');
    fila.className = 'kbd-bar__scroll';
    bar.appendChild(fila);
  }

  function prevent(e) { e.preventDefault(); }   // el botó no pren el focus (no es tanca el teclat)

  TECLES.forEach(function (k) {
    if (k === null) {
      var s = document.createElement('span');
      s.className = 'kbd-bar__sep';
      fila.appendChild(s);
      return;
    }
    if (typeof k === 'string') k = { label: k };
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'kbd-bar__btn' + (k.label.length > 2 ? ' kbd-bar__btn--word' : '');
    b.textContent = k.label;
    b.tabIndex = -1;
    if (k.title) b.title = k.title;
    else b.setAttribute('aria-label', 'Insereix ' + k.label);
    // Només mousedown: és el que trauria el focus de l'editor (i tancaria el
    // teclat del sistema). Cancel·lar touchstart o pointerdown, com feia
    // PyCat, també cancel·la el clic en una pantalla tàctil: la tecla no
    // escrivia res.
    b.addEventListener('mousedown', prevent);
    // L'acció es fa a 'click': un lliscament per desplaçar la barra no escriu res.
    b.addEventListener('click', function () {
      if (k.accio && ACCIONS[k.accio]) ACCIONS[k.accio]();
      else editText(k.text != null ? k.text : k.label);
      if (FIXA) ta.focus();
    });
    fila.appendChild(b);
  });

  if (!FIXA) { wrap.parentNode.insertBefore(bar, wrap.nextSibling); return; }

  document.body.appendChild(bar);
  ta.addEventListener('focus', function () {
    bar.classList.add('visible');
    document.body.classList.add('kbd-active');
  });
  ta.addEventListener('blur', function () {
    // Petit retard: si el blur ve d'un toc a la barra, el clic s'ha d'executar abans.
    setTimeout(function () {
      if (document.activeElement !== ta) {
        bar.classList.remove('visible');
        document.body.classList.remove('kbd-active');
      }
    }, 150);
  });
})();
