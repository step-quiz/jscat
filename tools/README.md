# JSCat — Eines de desenvolupament (`tools/`)

## `generate-pages.js` — Generador de pàgines del curs

Eina per generar HTML de capítols i reptes a partir de descripcions JSON a `tools/pages/*.json`. Permet editar en un sol lloc l'esquelet comú i canviar-lo per totes les pàgines alhora.

L'esquelet és el de les pàgines actuals de JSCat: la capçalera (`<header class="topbar">`) i la
barra lateral escrites a la pàgina, i al final `progress.js`, `capitols.js`, el `<script>` que pinta
la barra lateral i els simuladors, i `../footer.js`. El mateix generador és a PyCat i GeoCat; només
hi canvia el bloc `PROJECTE` del principi del fitxer (l'esquelet de cada curs).

### Ús

```bash
# Genera totes les pàgines a curs/
node tools/generate-pages.js

# Genera només una (per nom del fitxer de sortida sense extensió)
node tools/generate-pages.js --only repte-6

# Dry run: mostra què generaria sense escriure cap fitxer
node tools/generate-pages.js --dry-run

# Comprova (sense escriure res) que cada JSON produeix la pàgina que hi ha a curs/
# (GitHub ho fa a cada canvi: tests.yml)
node tools/generate-pages.js --comprova

# Canvia els directoris d'entrada/sortida
node tools/generate-pages.js --input tools/pages --out curs
```

### Format del fitxer JSON

Cada pàgina és un `tools/pages/{nom}.json` amb aquesta estructura:

```jsonc
{
  "type":  "capitol" | "repte",       // obligatori
  "num":   6,                          // número del capítol/repte
  "titol": "Parell o senar",           // títol visible
  "difficulty": "facil" | "intermedi" | "dificil",   // només reptes
  "lead":  "<p>Text d'introducció…</p>",              // només capítols (opcional)
  "prev":  { "url": "repte-5.html", "label": "← Repte anterior" },   // opcional
  "next":  { "url": "repte-7.html", "label": "Repte següent →" },     // opcional
  "hint":  "<p>Pista HTML opcional…</p>",             // només reptes (opcional)
  "sections": [
    // Forma simple: una secció amb un h2 i body
    { "h2": "Títol", "body": "<p>HTML…</p>" },

    // Forma agrupada: una <section> amb múltiples h2s
    {
      "parts": [
        { "h2": "Objectiu",  "body": "<p>…</p>" },
        { "h2": "Simulador", "body": "<p>…</p>", "simulador": { /* veure sota */ } }
      ]
    }
  ]
}
```

### Atributs del simulador

Dins d'una `part` o `section`, el camp `simulador` genera el `<div class="simulador" data-*>` que `curs/capitols.js` converteix en iframe:

```jsonc
"simulador": {
  "goalId":   "repte-2",                     // per al sistema de progrés
  "code":     "// codi inicial\n",            // codi precarregat a l'editor
  "stdin":    "5\n",                          // per a exercicis amb un sol cas
  "expected": "sortida",                     //    "    "    "
  "tests":    [{ "stdin": "4", "expected": "Parell" }],   // diversos casos
  "testcode": "console.log(f(2));\n",         // codi afegit després del de l'alumne
  "mode":     "dom",                         // simulador de pàgina web (amb "html")
  "html":     "<!DOCTYPE html>…",            // la pàgina del mode dom
  "readonly": false,                         // true = no editable (exemples)
  "height":   320
}
```

`stdin`/`expected` i `tests` són mútuament exclusius: fes servir `tests` si hi ha més d'un cas.

### Pàgines d'exemple

- `tools/pages/repte-1.json` — l'únic repte publicat, amb `expected` simple.

Els reptes 2–13 ja són a `REPTES_DATA` de `curs/capitols.js` però encara no tenen pàgina: es poden
escriure com a JSON i generar amb aquesta eina.

### Verificació

Després de generar:

1. `node tools/generate-pages.js --comprova` ha de dir que totes les pàgines coincideixen.
2. Serveix el projecte amb `python3 -m http.server` i obre la pàgina al navegador: el simulador ha de
   validar la solució i el repte s'ha de marcar com a superat a la barra lateral.

### Migrar pàgines existents

L'eina **no migra automàticament** les pàgines actuals. Per passar-ne una a JSON: obre'n l'HTML,
identifica-hi el títol, les seccions (`<h2>` + contingut), el simulador (`<div class="simulador"
data-*>`) i la pista (`<details>`), i tradueix-ho a l'estructura de dalt. Després,
`--comprova` et dirà si el JSON reprodueix exactament la pàgina (no hi compten els espais ni la
indentació de l'HTML, però sí qualsevol canvi de text, d'atributs o de codi).

## `extreu-pagina.js` — De pàgina a JSON

Fa el camí invers: llegeix un repte de `curs/` i n'escriu el JSON.

```bash
node tools/extreu-pagina.js curs/repte-1.html          # el mostra
node tools/extreu-pagina.js curs/repte-1.html --desa   # el desa a tools/pages/repte-1.json
```

Després, `node tools/generate-pages.js --comprova` diu si el JSON reprodueix exactament la pàgina.
Comprovat amb tots els reptes publicats el 18/10/2026: tots surten idèntics.
