// ════════════════════════════════════════════════════════
// console.js — Panell de sortida + panell stdin
//
// Classes de línia:
//   out  — sortida del programa (console.log) — color text normal
//   err  — errors (console.error o errors no atrapats) — vermell
//   ok   — missatge d'èxit del sistema — verd
//   dim  — info del sistema — gris
//   in   — input de l'alumne (visualitzat al fer prompt) — accent
// ════════════════════════════════════════════════════════

function consolePush(text, type) {
  const el = document.getElementById('console-output');
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'con-line ' + (type || 'out');
  line.textContent = (text === '' || text == null) ? '\u00a0' : text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function consoleClear() {
  const el = document.getElementById('console-output');
  if (el) el.innerHTML = '';
}


// ── Panell stdin (per a prompt()) ───────────────────────
// Igual que el mode fallback de PyCat: l'alumne escriu una entrada
// per línia al panell, i el codi les llegirà cridant prompt().

function consoleShowStdinPanel() {
  const area = document.querySelector('.console-area');
  if (!area || document.getElementById('stdin-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'stdin-panel';
  panel.className = 'stdin-panel';

  const label = document.createElement('div');
  label.className = 'stdin-label';
  label.innerHTML = '<span>' + J.t('log.stdin') + '</span>' +
                    '<span class="stdin-hint">' + J.t('log.stdin.hint') + '</span>';

  const ta = document.createElement('textarea');
  ta.id = 'stdin-textarea';
  ta.className = 'stdin-textarea';
  ta.rows = 3;
  ta.spellcheck = false;
  ta.setAttribute('autocomplete', 'off');

  panel.appendChild(label);
  panel.appendChild(ta);
  area.appendChild(panel);
}

function consoleHideStdinPanel() {
  const panel = document.getElementById('stdin-panel');
  if (panel) panel.remove();
}

function consoleGetStdin() {
  const ta = document.getElementById('stdin-textarea');
  return ta ? ta.value : '';
}


// ── Exporta ──────────────────────────────────────────────
J.consolePush         = consolePush;
J.consoleClear        = consoleClear;
J.consoleShowStdinPanel = consoleShowStdinPanel;
J.consoleHideStdinPanel = consoleHideStdinPanel;
J.consoleGetStdin       = consoleGetStdin;
