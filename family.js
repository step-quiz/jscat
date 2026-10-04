// ════════════════════════════════════════════════════════
// family.js — Selector discret dels projectes "Cat"
//
// Mostra 4 icones petites a la capçalera (dins .topbar-actions).
// En passar-hi el ratolí, la icona creix i apareix el nom.
//
// ESCALAR: per afegir un projecte nou, només cal afegir una
// línia a CAT_PROJECTS i la seva icona a img/.
// ════════════════════════════════════════════════════════
(function () {
  // En mode embed (iframes del curs) la capçalera està amagada: no cal res.
  try {
    if (new URLSearchParams(location.search).get('embed') === '1') return;
  } catch (e) { /* ignore */ }

  var CURRENT = 'jscat';   // projecte actual (no és enllaç)

  var CAT_PROJECTS = [
    { id: 'htmlcat',  nom: 'HTMLCat',  url: 'https://htmlcat.step-quiz.net',  icona: 'htmlcat.svg'  },
    { id: 'pycat',    nom: 'PyCat',    url: 'https://pycat.step-quiz.net',    icona: 'pycat.svg'    },
    { id: 'karelcat', nom: 'KarelCat', url: 'https://karelcat.step-quiz.net', icona: 'karelcat.svg' },
    { id: 'jscat',    nom: 'JSCat',    url: 'https://jscat.step-quiz.net',    icona: 'jscat.svg'    }
  ];

  // Funciona tant a l'arrel com dins de /curs/
  var base = location.pathname.indexOf('/curs/') !== -1 ? '../img/' : 'img/';

  var host = document.querySelector('.topbar-actions');
  if (!host) return;

  var style = document.createElement('style');
  style.textContent = [
    '.cat-family { display: flex; align-items: center; gap: 10px; }',
    '.cat-family-item {',
    '  position: relative; display: block; width: 18px; height: 18px;',
    '  opacity: 0.55; filter: grayscale(0.6);',
    '  transform-origin: center; z-index: 1;',
    '  transition: transform .18s cubic-bezier(.3,1.4,.5,1), opacity .15s, filter .15s;',
    '  border-radius: 4px; outline-offset: 3px;',
    '}',
    '.cat-family-item img { display: block; width: 100%; height: 100%; }',
    '.cat-family-item:hover, .cat-family-item:focus-visible {',
    '  transform: scale(1.9); opacity: 1; filter: none; z-index: 5;',
    '}',
    /* Projecte actual: una mica més visible + puntet a sota */
    '.cat-family-item.is-current { opacity: 0.9; filter: none; cursor: default; }',
    '.cat-family-item.is-current::after {',
    '  content: ""; position: absolute; left: 50%; bottom: -5px;',
    '  width: 3px; height: 3px; margin-left: -1.5px; border-radius: 50%;',
    '  background: var(--muted, #888);',
    '}',
    /* Etiqueta: a l'esquerra de les icones, dins la franja de la capçalera */
    '.cat-family { position: relative; }',
    '.cat-label {',
    '  position: absolute; right: calc(100% + 14px); top: 50%; transform: translateY(-50%);',
    '  font: 0.62rem var(--mono, monospace); white-space: nowrap; color: var(--muted, #888);',
    '  opacity: 0; transition: opacity .15s; pointer-events: none;',
    '}',
    '.cat-family.has-label .cat-label { opacity: 1; }',
    /* Pantalles tàctils: sense hover, icones una mica més grans i sense etiqueta */
    '@media (hover: none) {',
    '  .cat-family-item { width: 20px; height: 20px; opacity: .8; filter: none; }',
    '  .cat-label { display: none; }',
    '}',
    '@media (max-width: 500px) { .cat-family { gap: 8px; } }',
    '@media (prefers-reduced-motion: reduce) { .cat-family-item { transition: none; } }'
  ].join('\n');
  document.head.appendChild(style);

  var nav = document.createElement('nav');
  nav.className = 'cat-family';
  nav.setAttribute('aria-label', 'Altres projectes de la família Cat');

  var label = document.createElement('span');
  label.className = 'cat-label';
  label.setAttribute('aria-hidden', 'true');
  nav.appendChild(label);
  function showLabel(t) { label.textContent = t; nav.classList.add('has-label'); }
  function hideLabel()  { nav.classList.remove('has-label'); }

  CAT_PROJECTS.forEach(function (p) {
    var isCur = p.id === CURRENT;
    var el = document.createElement(isCur ? 'span' : 'a');
    el.className = 'cat-family-item' + (isCur ? ' is-current' : '');
    if (isCur) {
      el.setAttribute('aria-current', 'page');
      el.setAttribute('aria-label', p.nom + ' (projecte actual)');
    } else {
      el.href = p.url;
      el.target = '_blank';          // no perdem el codi de l'editor
      el.rel = 'noopener';
      el.setAttribute('aria-label', 'Obre ' + p.nom);
    }
    var img = document.createElement('img');
    img.src = base + p.icona;
    img.alt = '';
    img.draggable = false;
    el.appendChild(img);
    el.addEventListener('mouseenter', function () { showLabel(p.nom); });
    el.addEventListener('focus',      function () { showLabel(p.nom); });
    el.addEventListener('mouseleave', hideLabel);
    el.addEventListener('blur',       hideLabel);
    nav.appendChild(el);
  });

  host.appendChild(nav);
})();
