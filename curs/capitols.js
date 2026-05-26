// ════════════════════════════════════════════════════════
// curs/capitols.js — Dades dels capítols i helpers de UI
//
// Funcions exportades al window global:
//   injectCursLogo()           — pobla .logo-icon
//   renderSidebar(currentNum)  — omple #sidebar-nav (capítols, amb ✓ de progrés)
//   renderReptesSidebar(num)   — sidebar pels reptes (amb ✓ de progrés)
//   renderSimuladors()         — converteix .simulador → iframes
//   initSidebarToggle()        — hamburger mòbil
// ════════════════════════════════════════════════════════


// ── Logo (icona JS quadrat groc amb JS negre) ────────────
function injectCursLogo() {
  document.querySelectorAll('.logo-icon').forEach(function(el) {
    if (!el.innerHTML.trim()) el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="1.4em" height="1.4em" style="vertical-align:middle"><rect width="32" height="32" rx="3" fill="#F7DF1E"/><path d="M21.4 24.2c.6 1 1.4 1.7 2.8 1.7 1.2 0 2-.6 2-1.4 0-1-.8-1.4-2.1-1.9l-.7-.3c-2.1-.9-3.5-2-3.5-4.4 0-2.2 1.7-3.9 4.3-3.9 1.9 0 3.3.7 4.2 2.4l-2.3 1.5c-.5-.9-1-1.3-1.9-1.3-.9 0-1.5.6-1.5 1.3 0 .9.6 1.3 1.9 1.9l.7.3c2.5 1.1 3.9 2.1 3.9 4.5 0 2.7-2.1 4.1-4.9 4.1-2.8 0-4.6-1.3-5.4-3l2.5-1.5zM12.1 24.4c.5.8 1 1.5 2 1.5.9 0 1.5-.4 1.5-1.8v-9.4h2.9v9.5c0 2.9-1.7 4.3-4.3 4.3-2.3 0-3.6-1.2-4.3-2.6l2.2-1.5z" fill="#000"/></svg>';
  });
}


// ── Dades dels capítols ──────────────────────────────────
// ESCALAR: afegir capítols aquí i crear el fitxer HTML corresponent.
// goalId: identificador del repte d'exercici del capítol (null si no en té).

var CAPITOLS_DATA = [
  // ── Part A — JavaScript de consola ──
  { num: 1,  titol: 'Hola, JavaScript!',         arxiu: 'capitol-1.html',  goalId: 'cap-1-ex' },
  { num: 2,  titol: 'Variables',                  arxiu: 'capitol-2.html',  goalId: 'cap-2-ex' },
  { num: 3,  titol: 'Operacions i text',          arxiu: 'capitol-3.html',  goalId: 'cap-3-ex' },
  { num: 4,  titol: 'Decisions: if, else',        arxiu: 'capitol-4.html',  goalId: 'cap-4-ex' },
  { num: 5,  titol: 'Bucles: while i for',        arxiu: 'capitol-5.html',  goalId: 'cap-5-ex' },
  { num: 6,  titol: 'Arrays',                     arxiu: 'capitol-6.html',  goalId: 'cap-6-ex' },
  { num: 7,  titol: 'Funcions',                   arxiu: 'capitol-7.html',  goalId: 'cap-7-ex' },
  { num: 8,  titol: 'Objectes',                   arxiu: 'capitol-8.html',  goalId: 'cap-8-ex' },
  // ── Part B — JavaScript al navegador ──
  { num: 9,  titol: 'La pàgina parla (DOM)',      arxiu: 'capitol-9.html',  goalId: 'cap-9-ex' },
  { num: 10, titol: 'Esdeveniments',              arxiu: 'capitol-10.html', goalId: 'cap-10-ex' },
  { num: 11, titol: 'Canvas: dibuixar',           arxiu: 'capitol-11.html', goalId: 'cap-11-ex' },
  { num: 12, titol: 'Animació i mini-joc',        arxiu: 'capitol-12.html', goalId: 'cap-12-ex' },
];

var REPTES_DATA = [
  { num: 1,  titol: 'El primer programa',        arxiu: 'repte-1.html',  goalId: 'repte-1' },
  { num: 2,  titol: 'Presenta\'t',                arxiu: 'repte-2.html',  goalId: 'repte-2' },
  { num: 3,  titol: 'La calculadora',             arxiu: 'repte-3.html',  goalId: 'repte-3' },
  { num: 4,  titol: 'Parell o senar',             arxiu: 'repte-4.html',  goalId: 'repte-4' },
  { num: 5,  titol: 'El més gran de tres',        arxiu: 'repte-5.html',  goalId: 'repte-5' },
  { num: 6,  titol: 'Compte enrere',              arxiu: 'repte-6.html',  goalId: 'repte-6' },
  { num: 7,  titol: 'La mitjana',                 arxiu: 'repte-7.html',  goalId: 'repte-7' },
  { num: 8,  titol: 'Taula de multiplicar',       arxiu: 'repte-8.html',  goalId: 'repte-8' },
  { num: 9,  titol: 'Paraula al revés',           arxiu: 'repte-9.html',  goalId: 'repte-9' },
  { num: 10, titol: 'FizzBuzz',                   arxiu: 'repte-10.html', goalId: 'repte-10' },
  { num: 11, titol: 'El botó que canvia',         arxiu: 'repte-11.html', goalId: 'repte-11' },
  { num: 12, titol: 'Comptador de clics',         arxiu: 'repte-12.html', goalId: 'repte-12' },
  { num: 13, titol: 'Atrapa el quadrat (joc)',    arxiu: 'repte-13.html', goalId: 'repte-13' },
];


// ── Sistema de progrés ───────────────────────────────────
var _LS_KEY = 'jscat_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(_LS_KEY) || '{}');
  } catch(_) { return {}; }
}

function saveGoalCompleted(goalId) {
  if (!goalId) return;
  var p = getProgress();
  if (p[goalId]) return;
  p[goalId] = true;
  try { localStorage.setItem(_LS_KEY, JSON.stringify(p)); } catch(_) {}
}

function isGoalCompleted(goalId) {
  if (!goalId) return false;
  return !!getProgress()[goalId];
}


// ── Sidebar: capítols ────────────────────────────────────

function renderSidebar(currentNum) {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  var progress = getProgress();

  var html = '<div class="sidebar-section-title">Capítols</div>';
  html += '<ul class="sidebar-list">';
  for (var i = 0; i < CAPITOLS_DATA.length; i++) {
    var c = CAPITOLS_DATA[i];
    var isActive = c.num === currentNum;
    var check = (c.goalId && progress[c.goalId]) ? '<span class="sidebar-check" aria-label="completat">✓</span>' : '';
    html += '<li class="sidebar-item' + (isActive ? ' active' : '') + '">' +
      '<a href="' + c.arxiu + '">' +
        check + c.num + '. ' + c.titol +
      '</a></li>';
  }
  html += '</ul>';
  nav.innerHTML = html;
}


// ── Sidebar: reptes ──────────────────────────────────────

function renderReptesSidebar(currentNum) {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  var progress = getProgress();

  var html = '<div class="sidebar-section-title">Reptes</div>';
  html += '<ul class="sidebar-list">';
  for (var i = 0; i < REPTES_DATA.length; i++) {
    var r = REPTES_DATA[i];
    var isActive = r.num === currentNum;
    var check = (r.goalId && progress[r.goalId]) ? '<span class="sidebar-check" aria-label="completat">✓</span>' : '';
    html += '<li class="sidebar-item' + (isActive ? ' active' : '') + '">' +
      '<a href="' + r.arxiu + '">' +
        check + 'Repte ' + r.num + ': ' + r.titol +
      '</a></li>';
  }
  html += '</ul>';
  nav.innerHTML = html;
}


// ── Renderitzador de simuladors incrustats ────────────────

function renderSimuladors() {
  document.querySelectorAll('.simulador').forEach(function(div) {
    var code     = div.getAttribute('data-code') || '';
    var readonly = div.getAttribute('data-readonly') === 'true';
    var height   = div.getAttribute('data-height') || '320';
    var stdin    = div.getAttribute('data-stdin') || '';
    var expected = div.getAttribute('data-expected') || '';
    var tests    = div.getAttribute('data-tests') || '';
    var testcode = div.getAttribute('data-testcode') || '';
    var goalId   = div.getAttribute('data-goal-id') || '';
    var mode     = div.getAttribute('data-mode') || '';   // 'dom' per a Part B
    var html     = div.getAttribute('data-html') || '';   // HTML base per a mode dom

    var params = new URLSearchParams();
    params.set('embed', '1');
    params.set('theme', 'light');

    if (code)     params.set('code', btoa(unescape(encodeURIComponent(code))));
    if (readonly) params.set('readonly', '1');
    if (stdin)    params.set('stdin', btoa(unescape(encodeURIComponent(stdin))));
    if (expected) params.set('expected', btoa(unescape(encodeURIComponent(expected))));
    if (tests)    params.set('tests', btoa(unescape(encodeURIComponent(tests))));
    if (testcode) params.set('testcode', btoa(unescape(encodeURIComponent(testcode))));
    if (goalId)   params.set('goalId', goalId);
    if (mode)     params.set('mode', mode);
    if (html)     params.set('html', btoa(unescape(encodeURIComponent(html))));

    var iframe = document.createElement('iframe');
    iframe.src = '../index.html?' + params.toString();
    iframe.style.width = '100%';
    iframe.style.height = height + 'px';
    iframe.style.border = '1px solid #d0d0d0';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('loading', 'lazy');

    div.innerHTML = '';
    div.appendChild(iframe);

    // Botó pantalla completa (visible en mòbil via CSS)
    var fullscreenBtn = document.createElement('a');
    fullscreenBtn.href = '../index.html?' + params.toString();
    fullscreenBtn.target = '_blank';
    fullscreenBtn.rel = 'noopener';
    fullscreenBtn.className = 'simulador-fullscreen-btn';
    fullscreenBtn.textContent = '↗ Obre a pantalla completa';
    div.appendChild(fullscreenBtn);

    if (goalId) {
      var fb = document.createElement('div');
      fb.className = 'simulador-feedback';
      fb.setAttribute('data-goal-id', goalId);
      if (isGoalCompleted(goalId)) {
        fb.className = 'simulador-feedback fb-ok';
        fb.textContent = '✓ Completat anteriorment.';
      }
      div.appendChild(fb);
    }
  });
}


// ── Sidebar toggle (hamburger mòbil) ─────────────────────

function initSidebarToggle() {
  var toggle  = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar) return;

  var open = function() {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
  };
  var close = function() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', function() {
    sidebar.classList.contains('open') ? close() : open();
  });

  if (overlay) overlay.addEventListener('click', close);
}


// ── Listener de feedback des dels iframes ────────────────

window.addEventListener('message', function(e) {
  if (e.origin !== window.location.origin) return;
  if (!e.data) return;
  var type   = e.data.type;
  var goalId = e.data.goalId;

  if (type === 'jscat-clear') {
    var fb = goalId ? document.querySelector('.simulador-feedback[data-goal-id="' + CSS.escape(goalId) + '"]') : null;
    if (fb) { fb.className = 'simulador-feedback'; fb.textContent = ''; }
    return;
  }

  if (type === 'jscat-result') {
    var success = e.data.success;
    var fb = goalId ? document.querySelector('.simulador-feedback[data-goal-id="' + CSS.escape(goalId) + '"]') : null;
    if (!fb) return;

    if (success) {
      fb.className = 'simulador-feedback fb-ok';
      var n = (e.data.results && e.data.results.length) || 0;
      fb.textContent = n > 1
        ? '✓ Correcte! Has passat els ' + n + ' tests.'
        : '✓ Correcte! El programa funciona bé.';

      saveGoalCompleted(goalId);
      _refreshSidebar();

    } else {
      fb.className = 'simulador-feedback fb-ko';
      var results = e.data.results || [];
      var failed = null;
      for (var i = 0; i < results.length; i++) {
        if (!results[i].passed) { failed = results[i]; break; }
      }
      if (failed && failed.actual === null) {
        fb.textContent = '✗ El programa ha donat error. Revisa la consola.';
      } else if (failed) {
        var stdinInfo = failed.stdin
          ? ' amb input «' + failed.stdin.replace(/\n/g, ' | ') + '»'
          : '';
        fb.textContent = '✗ Test ' + (failed.testIdx + 1) + ' fallit' + stdinInfo +
          ': esperava «' + failed.expected + '», has tret «' + (failed.actual || '') + '».';
      } else {
        fb.textContent = '✗ La sortida no coincideix amb l\'esperada. Revisa el codi.';
      }
    }
  }
});

function _refreshSidebar() {
  var path = window.location.pathname;
  var capMatch = path.match(/capitol-(\d+)\.html/);
  var repMatch = path.match(/repte-(\d+)\.html/);
  if (capMatch) renderSidebar(parseInt(capMatch[1], 10));
  else if (repMatch) renderReptesSidebar(parseInt(repMatch[1], 10));
}


// ── Exporta ──────────────────────────────────────────────
window.injectCursLogo      = injectCursLogo;
window.renderSidebar       = renderSidebar;
window.renderReptesSidebar = renderReptesSidebar;
window.renderSimuladors    = renderSimuladors;
window.initSidebarToggle   = initSidebarToggle;
window.getProgress         = getProgress;
window.saveGoalCompleted   = saveGoalCompleted;
window.isGoalCompleted     = isGoalCompleted;
