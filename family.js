// ════════════════════════════════════════════════════════
// family.js — Selector discret dels projectes "Cat"
//
// Mostra el text "EXPLORA" i 4 icones petites a la capçalera
// (dins .topbar-actions). En passar-hi el ratolí per sobre:
//   · la icona creix i fa un "shake-and-blink" d'1 segon
//   · les altres 3 s'encongeixen un 20% i s'aclareixen un 10%
//   · el text "EXPLORA" és substituït pel nom del projecte
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

  // Tipografia del text "EXPLORA": Josefin Sans, majúscules molt espaiades
  // (aire de cartell d'expedició). Si no carrega, cau a una sans-serif normal.
  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@600&display=swap';
  document.head.appendChild(font);

  var style = document.createElement('style');
  style.textContent = [
    '.cat-family { display: flex; align-items: center; gap: 12px; }',

    /* ── Text "EXPLORA" / nom del projecte (mateix espai, es creuen) ── */
    '.cat-label {',
    '  display: grid; justify-items: end; align-items: center;',
    '  margin-right: 4px; text-transform: uppercase; white-space: nowrap;',
    "  font: 600 0.68rem/1 'Josefin Sans', 'Trebuchet MS', 'Segoe UI', sans-serif;",
    '  letter-spacing: 0.3em; user-select: none;',
    '  transform: translateY(0.2em);',          /* centrat òptic: les majúscules de Josefin queden altes */
    '}',
    '.cat-label > span {',
    '  grid-area: 1 / 1; margin-right: -0.3em;', /* compensa l'espai final del letter-spacing */
    '  transition: opacity .35s ease, transform .35s ease;',
    '}',
    '.cat-explora { color: var(--muted, #888); }',
    '.cat-name { color: var(--text, #ddd); opacity: 0; transform: translateX(8px); }',
    '.cat-family.has-active .cat-explora { opacity: 0; transform: translateX(-8px); }',
    '.cat-family.has-active .cat-name { opacity: 1; transform: none; }',

    /* ── Icones ── */
    '.cat-family-item {',
    '  position: relative; display: block; width: 18px; height: 18px;',
    '  opacity: 0.55; filter: grayscale(0.6);',
    '  transform-origin: center; z-index: 1;',
    '  transition: transform .5s ease-out, opacity .5s ease-out, filter .5s ease-out;',
    '  border-radius: 4px; outline-offset: 3px;',
    '}',
    '.cat-family-item img { display: block; width: 100%; height: 100%; }',

    /* Projecte actual: una mica més visible + puntet a sota */
    '.cat-family-item.is-current { opacity: 0.9; filter: none; cursor: default; }',
    '.cat-family-item.is-current::after {',
    '  content: ""; position: absolute; left: 50%; bottom: -5px;',
    '  width: 3px; height: 3px; margin-left: -1.5px; border-radius: 50%;',
    '  background: var(--muted, #888);',
    '}',

    /* Quan una icona és activa, les altres 3: -20% de mida, +10% de lluminositat */
    '.cat-family.has-active .cat-family-item:not(.is-active) {',
    '  transform: scale(0.8); filter: grayscale(0.6) brightness(1.1);',
    '}',
    '.cat-family.has-active .cat-family-item.is-current:not(.is-active) { filter: brightness(1.1); }',

    /* Icona activa: creix, color ple i "shake-and-blink" d'1 s */
    '.cat-family-item.is-active { transform: scale(1.9); opacity: 1; filter: none; z-index: 5; }',
    '.cat-family-item.is-active img { animation: cat-shake-blink 1s ease-in-out 1; }',

    '@keyframes cat-shake-blink {',
    '  0%   { transform: translateX(0) rotate(0);        opacity: 1;   }',
    '  10%  { transform: translateX(-1.5px) rotate(-8deg); opacity: 1;   }',
    '  20%  { transform: translateX(1.5px) rotate(8deg);   opacity: 0.2; }',
    '  30%  { transform: translateX(-1.5px) rotate(-8deg); opacity: 1;   }',
    '  40%  { transform: translateX(1.5px) rotate(8deg);   opacity: 0.2; }',
    '  50%  { transform: translateX(-1px) rotate(-5deg);   opacity: 1;   }',
    '  60%  { transform: translateX(1px) rotate(5deg);     opacity: 0.3; }',
    '  70%  { transform: translateX(-0.5px) rotate(-2deg); opacity: 1;   }',
    '  80%  { transform: translateX(0) rotate(0);          opacity: 1;   }',
    '  100% { transform: translateX(0) rotate(0);          opacity: 1;   }',
    '}',

    /* Pantalles amples: les 4 icones centrades horitzontalment a la capçalera,
       i "EXPLORA" penjant a la seva esquerra (no desplaça res). */
    '@media (min-width: 720px) {',
    '  .topbar { position: relative; }',
    '  .cat-family { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }',
    '  .cat-label { position: absolute; right: calc(100% + 16px); top: 50%; margin: 0;',
    '               transform: translateY(calc(-50% + 0.2em)); }',
    '}',

    /* Pantalles tàctils: sense hover, icones una mica més grans, sense nom */
    '@media (hover: none) {',
    '  .cat-family-item { width: 20px; height: 20px; opacity: .8; filter: none; }',
    '  .cat-name { display: none; }',
    '}',
    '@media (max-width: 500px) {',
    '  .cat-family { gap: 9.6px; }',
    '  .cat-label { display: none; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .cat-family-item, .cat-label > span { transition: none; }',
    '  .cat-family-item.is-active img { animation: none; }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var nav = document.createElement('nav');
  nav.className = 'cat-family';
  nav.setAttribute('aria-label', 'Altres projectes de la família Cat');

  var label = document.createElement('span');
  label.className = 'cat-label';
  label.setAttribute('aria-hidden', 'true');
  var explora = document.createElement('span');
  explora.className = 'cat-explora';
  explora.textContent = 'Explora';
  var nameEl = document.createElement('span');
  nameEl.className = 'cat-name';
  label.appendChild(explora);
  label.appendChild(nameEl);
  nav.appendChild(label);

  // ── Estat actiu (hover/focus) ──
  // Petit retard en desactivar: evita parpelleigs en passar d'una icona a l'altra.
  var activeEl = null, hideTimer = null;
  function activate(el, nom) {
    clearTimeout(hideTimer);
    if (activeEl && activeEl !== el) activeEl.classList.remove('is-active');
    activeEl = el;
    nameEl.textContent = nom;
    el.classList.add('is-active');
    nav.classList.add('has-active');
  }
  function deactivate() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (activeEl) activeEl.classList.remove('is-active');
      activeEl = null;
      nav.classList.remove('has-active');
    }, 80);
  }
  var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

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

    if (canHover) {
      el.addEventListener('mouseenter', function () { activate(el, p.nom); });
      el.addEventListener('mouseleave', deactivate);
    }
    // Teclat (Tab): mateix efecte. En tàctil no, perquè el focus quedaria enganxat.
    el.addEventListener('focus', function () {
      if (el.matches && el.matches(':focus-visible')) activate(el, p.nom);
    });
    el.addEventListener('blur', deactivate);
    nav.appendChild(el);
  });

  host.appendChild(nav);
})();
