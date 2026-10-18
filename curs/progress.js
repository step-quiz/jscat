// ════════════════════════════════════════════════════════
// progress.js — Progrés de l'alumne (exercicis i reptes superats)
//
// FITXER COMÚ: ve de step-quiz/step-quiz-commons i se sobreescriu sol.
// No l'editis aquí: canvia'l a step-quiz-commons (fitxers/progress.js) i, si
// és una cosa només d'aquest web, a comuns.json (bloc "config").
//
// Es desa a localStorage[CLAU] un objecte { goalId: true, ... }.
// Invariant: un èxit no es desgrava mai (no hi ha cap manera de posar false).
// La clau i el format són els mateixos que tenia cada curs abans de compartir
// aquest fitxer (18/10/2026), així que el progrés desat es conserva.
//
// API (funcions globals, com abans): getProgress(), saveGoalCompleted(goalId),
// isGoalCompleted(goalId) i clearProgress().
// S'ha de carregar abans de capitols.js.
// ════════════════════════════════════════════════════════

// Configuració d'aquest web (la hi posa sincronitza.py a partir de comuns.json):
//   clau → clau de localStorage (p. ex. 'pycat_progress')
var _PROGRESS_CONFIG = {"clau": "jscat_progress"};
var _LS_KEY = _PROGRESS_CONFIG.clau || 'cat_progress';

function getProgress() {
  try {
    var p = JSON.parse(localStorage.getItem(_LS_KEY) || '{}');
    return p && typeof p === 'object' ? p : {};
  } catch (_) { return {}; }   // localStorage bloquejat o dades malmeses
}

function saveGoalCompleted(goalId) {
  if (!goalId) return;
  var p = getProgress();
  if (p[goalId]) return;  // ja guardat
  p[goalId] = true;
  try { localStorage.setItem(_LS_KEY, JSON.stringify(p)); } catch (_) {}
}

function isGoalCompleted(goalId) {
  if (!goalId) return false;
  return !!getProgress()[goalId];
}

function clearProgress() {
  try { localStorage.removeItem(_LS_KEY); } catch (_) {}
}
