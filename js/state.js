// ════════════════════════════════════════════════════════
// state.js — Estat centralitzat de JSCat
// ════════════════════════════════════════════════════════

J.state = {
  // UI
  currentState: 'idle',   // idle | running | done | error

  // Worker
  worker:       null,
  workerReady:  false,

  // Execució
  running:      false,
  startTime:    null,

  // Exercici (quan s'usa dins d'un iframe del curs)
  //   goalId:    identificador del repte
  //   testCases: array de {stdin, expected}  — null si no hi ha validació
  //   testCode:  codi JS que s'appendeja al codi de l'alumne abans d'executar
  //   freeStdin: stdin d'un simulador no validat
  goalId:       '',
  testCases:    null,
  testCode:     '',
  freeStdin:    null,
};
