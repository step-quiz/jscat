# JSCat

Curs interactiu per aprendre **JavaScript** al navegador, en català.
Tercer projecte de la sèrie després de [KarelCat](https://karelcat.step-quiz.net)
i [PyCat](https://pycat.step-quiz.net), seguint el mateix patró pedagògic i visual.

---

## Què és

JSCat és un curs de JavaScript adreçat a alumnes de secundària (16 anys, sense
experiència prèvia). Combina:

- **Part A — JavaScript de consola** (capítols 1–8): variables, decisions, bucles,
  funcions, arrays, objectes. El mateix terreny que PyCat però amb sintaxi JS.
- **Part B — JavaScript al navegador** (capítols 9–12): DOM, esdeveniments, canvas,
  animació i un mini-joc final. Aquí JS brilla amb el que el fa únic.

El curs consta de **12 capítols** i **13 reptes** amb validació automàtica.
Tot al navegador, sense instal·lació.

## Estat actual (esquelet inicial)

| Element | Estat |
|---------|-------|
| Runner (Web Worker amb captura de `console.log`, `console.error`, `prompt`) | ✅ Implementat |
| Editor amb ressaltat sintàctic JS i autocompletat | ✅ Implementat |
| Sistema d'iframes per als simuladors incrustats al curs | ✅ Implementat |
| Validació de reptes amb `data-expected` / `data-tests` / `data-testcode` | ✅ Implementat |
| Sistema de progrés (localStorage, ✓ a la sidebar) | ✅ Implementat |
| Capítol 1 — Hola, JavaScript! | ✅ Escrit |
| Capítols 2–12 | ⏳ Per escriure |
| Repte 1 — El primer programa | ✅ Escrit |
| Reptes 2–13 | ⏳ Per escriure |
| Mode "DOM" per a Part B (iframe sandbox amb pàgina viva) | ⏳ Per dissenyar |

## Estructura de fitxers

```
jscat/
├── index.html              ← Simulador lliure de JavaScript
├── style.css               ← Estils del simulador
│
├── js/
│   ├── constants.js        ← Configuració global, claus localStorage
│   ├── i18n.js             ← Sistema de traduccions
│   ├── state.js            ← Estat centralitzat (namespace J)
│   ├── jsrunner.js         ← Wrapper del Worker
│   ├── jsworker.js         ← Web Worker: captura console.*, prompt, etc.
│   ├── editor.js           ← Editor de codi amb ressaltat JS
│   ├── console.js          ← Panell de sortida + panell stdin
│   ├── ui.js               ← Botons, validació, tema, fitxers
│   └── main.js             ← Inicialització
│
├── curs/
│   ├── index.html          ← Índex del curs
│   ├── capitol-1.html      ← Hola, JavaScript! (escrit)
│   ├── capitol-2..12       ← Per escriure
│   ├── repte-1.html        ← El primer programa (escrit)
│   ├── repte-2..13         ← Per escriure
│   ├── capitols.js         ← Dades dels capítols/reptes + renderers
│   └── curs.css            ← Estils del curs
│
├── img/
│   └── cc-by-nc-nd.png
├── footer.js               ← Footer comú CC BY-NC-ND
├── LICENSE
└── README.md
```

## Servir en local

```bash
python3 -m http.server 8000
```

Obre [http://localhost:8000](http://localhost:8000) per al simulador lliure,
o [http://localhost:8000/curs/](http://localhost:8000/curs/) per al curs.

> **Nota:** Cal un servidor HTTP (no obrir els `.html` directament com a fitxers)
> perquè els Web Workers no es poden carregar des de l'origen `file://`.

## Arquitectura breu

A diferència de PyCat (que carregava Pyodide), aquí el codi de l'alumne s'executa
**directament al navegador** dins d'un Web Worker:

- El Worker (`js/jsworker.js`) sobreescriu `console.log/error/warn/info` per redirigir
  la sortida cap al pare via `postMessage`.
- `prompt()` no és nadiu dins d'un Worker; el sobreescrivim perquè llegeixi línies
  d'un **stdin pre-carregat** (igual que el mode fallback de PyCat sense
  SharedArrayBuffer). Cada crida a `prompt()` consumeix una línia.
- `alert()` redirigeix a stdout.
- Els bucles infinits es maten amb `worker.terminate()` després del timeout (5s).
- La validació dels reptes funciona igual que a PyCat: compara stdout contra
  `data-expected` (mode A), executa múltiples casos via `data-tests` (mode B),
  o afegeix codi de test via `data-testcode` (mode C).

### Què queda pendent

- **Mode DOM per a la Part B**: els capítols 9–12 manipularan una pàgina viva.
  Cal dissenyar un mode addicional on el codi s'executi dins d'un **iframe sandbox**
  amb un `<div id="pagina">` o `<canvas id="llenç">` predefinit. El pare ensenyarà
  l'iframe a la dreta enlloc de la consola.
- Escriure capítols 2–12 i reptes 2–13.
- Glossari (opcional, com a PyCat).

## Llicència

Llicència **CC BY-NC-ND 4.0** — ús educatiu lliure, prohibida la comercialització
i la modificació.
