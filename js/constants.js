// ════════════════════════════════════════════════════════
// constants.js — Configuració central de JSCat
//
// Namespace global: J (com K per a KarelCat, P per a PyCat)
// Cada mòdul afegeix les seves funcions a J.*
// ════════════════════════════════════════════════════════

const J = {};

// ── Claus de localStorage ────────────────────────────────
J.LS_KEY_CODE     = 'jscat_code';
J.LS_KEY_THEME    = 'jscat-theme';
J.LS_KEY_PROGRESS = 'jscat_progress';

// ── Codi per defecte al simulador lliure ─────────────────
J.DEFAULT_CODE = `// El teu primer programa JavaScript
console.log("Hola, món!");
`;

// ── Timeout d'execució (ms) ──────────────────────────────
// JS és més ràpid que Pyodide (no cal carregar runtime), però
// volem aturar bucles infinits ràpidament.
J.EXEC_TIMEOUT = 5000;   // 5 segons

// ── Helpers HTML ─────────────────────────────────────────
J.escHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
