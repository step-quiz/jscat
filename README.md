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

El curs està pensat per tenir **12 capítols** i **13 reptes** amb validació automàtica
(ara mateix hi ha els 12 capítols escrits i 1 repte).
Tot al navegador, sense instal·lació.

## Estat actual

### Capítols
| # | Títol | Estat |
|---|-------|-------|
| 1 | Hola, JavaScript! | ✅ Escrit |
| 2 | Variables | ✅ Escrit |
| 3 | Operacions i text | ✅ Escrit |
| 4 | Decisions: if, else if, else | ✅ Escrit |
| 5 | Bucles: while i for | ✅ Escrit |
| 6 | Arrays | ✅ Escrit |
| 7 | Funcions | ✅ Escrit |
| 8 | Objectes | ✅ Escrit |
| 9 | La pàgina parla (DOM) | ✅ Escrit |
| 10 | Esdeveniments | ✅ Escrit |
| 11 | Canvas: dibuixar | ✅ Publicat |
| 12 | Animació i mini-joc | ✅ Publicat |

### Reptes
| # | Títol | Estat |
|---|-------|-------|
| 1 | El primer programa | ✅ Escrit |
| 2-13 | Reptes finals | ⏳ Per escriure (definits a `capitols.js`, sense fitxer HTML) |

### Què es publica

Els interruptors de `curs/capitols.js` decideixen què es veu a la interfície:

- `VISIBLE_MAX_CHAPTER = 12`: es mostren tots els capítols (els 11 i 12 es van publicar el
  18/10/2026).
- `SHOW_REPTES = false`: la secció de reptes no es mostra.

Per publicar els reptes, n'hi ha prou de posar `SHOW_REPTES = true`.

### Infraestructura

| Element | Estat |
|---------|-------|
| Mode **consola** (Worker + `console.log`) per als capítols 1-8 | ✅ Implementat |
| Mode **DOM** (iframe sandbox + DOM viu + consola petita) per als capítols 9-12 | ✅ Implementat |
| Editor amb ressaltat sintàctic JS i autocompletat | ✅ Implementat |
| Sistema d'iframes per als simuladors incrustats al curs | ✅ Implementat |
| Validació de reptes amb `data-expected` / `data-tests` / `data-testcode` | ✅ Implementat |
| Sistema de progrés (localStorage, ✓ a la sidebar) | ✅ Implementat |

## Estructura de fitxers

```
jscat/
├── index.html              ← Benvinguda al curs (capítols / editor lliure)
├── editor.html             ← Editor JS lliure (simulador: mode consola i mode DOM)
├── style.css               ← Estils del simulador
│
├── js/
│   ├── constants.js        ← Configuració global (timeout 5 s), claus localStorage
│   │                         (jscat_code, jscat-theme, jscat_progress)
│   ├── i18n.js             ← Sistema de traduccions
│   ├── state.js            ← Estat centralitzat (namespace J)
│   ├── jsrunner.js         ← Wrapper del Worker (mode consola)
│   ├── jsworker.js         ← Web Worker: captura console.*, prompt, etc.
│   ├── domrunner.js        ← Wrapper de l'iframe (mode DOM)
│   ├── editor.js           ← Editor de codi amb ressaltat JS
│   ├── console.js          ← Panell de sortida + panell stdin
│   ├── ui.js               ← Botons, validació, tema, fitxers
│   ├── main.js             ← Inicialització
│   └── kbd-accessory.js    ← Barra de tecles per a pantalles tàctils (fitxer comú)
│
├── curs/
│   ├── index.html          ← Índex del curs
│   ├── capitol-1..12.html  ← Capítols
│   ├── repte-1.html        ← Únic repte escrit
│   ├── progress.js         ← Progrés de l'alumne (fitxer comú; clau jscat_progress)
│   ├── capitols.js         ← Dades dels capítols/reptes, interruptors de publicació + renderers
│   └── curs.css            ← Estils del curs
│
├── tools/                  ← Generador de pàgines JSON → HTML i el seu invers (vegeu tools/README.md)
│
├── img/
│   └── karelcat.svg, pycat.svg, jscat.svg, htmlcat.svg ← Icones de la família
├── family.js               ← Selector "EXPLORA" dels projectes germans (fitxer comú)
├── footer.js               ← Footer (fitxer comú)
├── LICENSE, LLICENCIA.md
└── README.md
```

## Fitxers comuns

`LICENSE`, `LLICENCIA.md`, `family.js`, `footer.js`, `js/kbd-accessory.js`, `curs/progress.js`, `curs/certificat.js` i les icones de la família (`img/htmlcat.svg`, `img/pycat.svg`, `img/karelcat.svg`, `img/jscat.svg`) són **fitxers comuns** dels cursos de la família: l'original és al repositori
[step-quiz-commons](https://github.com/step-quiz/step-quiz-commons), on també hi ha què té de
diferent aquest web (`comuns.json`). El workflow `.github/workflows/comuns.yml` els posa al dia
cada dia (o a mà: Actions → «Fitxers comuns» → Run workflow). **No els editis aquí**: el canvi es
perdria l'endemà. Canvia'ls a step-quiz-commons.

**Certificat.** A l'índex del curs (`curs/index.html`), `curs/certificat.js` mostra quants capítols porta l'alumne i, quan els té tots amb la ✓, el certificat (amb el seu nom i la data) per imprimir o desar en PDF. JSCat és l'últim curs de la sèrie KarelCat → PyCat → JSCat.

## Servir en local

Cal un servidor HTTP (no obrir els `.html` directament des de `file://`) perquè
els Web Workers no es poden carregar des d'aquest origen.

```bash
python3 -m http.server 8000
```

O fes servir l'extensió Live Server de VS Code, `npx serve`, etc.

Obre [http://localhost:8000](http://localhost:8000) per al simulador lliure,
o [http://localhost:8000/curs/](http://localhost:8000/curs/) per al curs.

Si despleges a GitHub Pages o Cloudflare Pages, funcionarà directament (són
servidors HTTP de veritat).

## Arquitectura tècnica

El codi de l'alumne s'executa en dos modes diferents segons el capítol:

### Mode consola (capítols 1-8)

S'executa dins d'un **Web Worker** (`js/jsworker.js`):
- Sobreescriu `console.log/error/warn/info` per redirigir la sortida cap al
  pare via `postMessage`.
- `prompt()` no és nadiu dins d'un Worker; el sobreescrivim perquè llegeixi
  línies d'un **stdin pre-carregat**. Els missatges automàtics del prompt es
  marquen com a "system" perquè es vegin a la consola però no comptin per a la
  validació de reptes.
- `alert()` redirigeix a stdout.
- Els **bucles infinits** es maten amb `worker.terminate()` després del timeout (5s).
- El worker es **re-spawna després de cada execució** per garantir un context
  net (evita errors de redeclaració de `let`/`const`).

### Mode DOM (capítols 9-12)

S'executa dins d'un **iframe sandbox** (`js/domrunner.js`):
- L'iframe té un HTML base configurable via `data-html` al simulador.
- Un script bootstrap dins l'iframe sobreescriu `console.*` per enviar la
  sortida al pare via `postMessage`.
- El codi de l'alumne s'injecta via `postMessage` i s'executa amb
  `(0,eval)(code)` al context global de l'iframe.
- L'alumne pot manipular el DOM real: `document.querySelector`, `addEventListener`,
  `<canvas>`, animacions amb `requestAnimationFrame`…
- L'iframe es **recarrega abans de cada execució** per estat net.
- **Atenció**: en mode DOM no podem matar bucles infinits. Si l'alumne en provoca un,
  cal recarregar la pestanya. El capítol 9 conté un avís clar sobre això.

### Sistema de validació

Tres modes (només a través del simulador, no canvia el codi de l'alumne):
- **`data-expected`**: compara stdout amb un text exacte.
- **`data-tests`**: llista de casos `[{stdin, expected}]` que s'executen
  seqüencialment. Cada test té el seu input simulat (mode consola).
- **`data-testcode`**: codi JS afegit després del de l'alumne. Útil per cridar
  funcions amb diversos arguments, o (mode DOM) per disparar clics
  programàticament amb `element.click()` i comprovar l'estat resultant.

## Enllaços

`.github/comprova-enllacos.py` comprova que els enllaços cap als altres webs de Step Quiz (`*.step-quiz.net`) funcionen. GitHub l'executa a cada canvi a `main`, cada dilluns al matí i a mà (`.github/workflows/enllacos.yml`, «Enllaços» a la pestanya Actions).

## Llicència

Contingut sota **CC BY-NC-SA 4.0** i codi sota **MIT** (vegeu `LLICENCIA.md`).
El peu de pàgina que genera `footer.js` diu el mateix.

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
