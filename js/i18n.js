// ════════════════════════════════════════════════════════
// i18n.js — Textos de la interfície JSCat (català)
// ════════════════════════════════════════════════════════

J.UI = {
  'ui.run':               '▶ Executa',
  'ui.stop':              '■ Atura',
  'ui.reset':             '↺ Neteja',
  'state.idle':           'llest',
  'state.running':        'executant…',
  'state.done':           'finalitzat',
  'state.error':          'error',
  'log.running':          '⚡ Executant…',
  'log.done':             '✅ Programa completat',
  'log.error':            '❌ Error',
  'log.timeout':          '⏱ Temps excedit (possible bucle infinit)',
  'log.ready':            '🟢 JavaScript llest',
  'log.reset':            '↺ Consola netejada',
  'log.stdin':            '📥 Entrades del programa',
  'log.stdin.hint':       '(una per línia — es passen a prompt())',
  'ui.validate':          '▶ Valida',
  'ui.readonly':          'No editable',
  'log.validating':       '── Validació ──',
};

// ── Funció de traducció ──────────────────────────────────
J.t = function(key) {
  return J.UI[key] !== undefined ? J.UI[key] : key;
};
