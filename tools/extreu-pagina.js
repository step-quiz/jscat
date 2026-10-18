#!/usr/bin/env node
// ════════════════════════════════════════════════════════
// tools/extreu-pagina.js — Fa el camí invers del generador: llegeix un repte
// de curs/ i n'escriu el JSON per a tools/pages/.
//
// Ús:
//   node tools/extreu-pagina.js curs/repte-7.html            # escriu el JSON a la sortida
//   node tools/extreu-pagina.js curs/repte-7.html --desa     # el desa a tools/pages/repte-7.json
//
// Serveix per passar a JSON un repte que encara només existeix en HTML. Després,
// «node tools/generate-pages.js --comprova» diu si el JSON reprodueix exactament
// la pàgina. Només entén els reptes (estructura regular: capçalera, seccions amb
// <h2>, simulador, pista i navegació); els capítols s'han de passar a mà.
// El mateix fitxer és a PyCat, JSCat i GeoCat.
// ════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { PROJECTE } = require('./generate-pages.js');

const DIFICULTATS = { 'Fàcil': 'facil', 'Intermedi': 'intermedi', 'Mitjà': 'mitja', 'Difícil': 'dificil' };

function descodifica(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

// Treu la indentació comuna d'un tros d'HTML (sense tocar els <pre>)
function desindenta(html) {
  const linies = html.replace(/^\n+|\s+$/g, '').split('\n');
  return linies.map(l => l.replace(/^ {6}/, '')).join('\n');
}

function atributs(div) {
  const out = {};
  const re = /data-([\w-]+)=("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(div))) out[m[1]] = descodifica(m[3] != null ? m[3] : m[4]);
  return out;
}

function simulador(div) {
  const a = atributs(div);
  const sim = {};
  // Atributs propis del simulador d'aquest curs (bloc PROJECTE del generador)
  const ORDRE = PROJECTE.atributsSimulador;
  for (const k of ORDRE) {
    if (!(k in a)) continue;
    const nom = k.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    if (k === 'tests') sim.tests = JSON.parse(a.tests);
    else if (k === 'height') sim.height = Number(a[k]);
    else if (a[k] === 'true') sim[nom] = true;
    else sim[nom] = a[k];
  }
  const desconeguts = Object.keys(a).filter(k => !ORDRE.includes(k));
  if (desconeguts.length) throw new Error('atributs del simulador que el generador no coneix: ' + desconeguts.join(', '));
  return sim;
}

function extreu(html) {
  const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
  const pagina = {};
  const ins = main.match(/<span class="chapter-badge[^"]*"[^>]*>⚡ Repte (\d+)(?: — ([^<]+))?<\/span>/);
  if (!ins) throw new Error('no és un repte (no trobo la insígnia «⚡ Repte N»)');
  pagina.type = 'repte';
  pagina.num = Number(ins[1]);
  pagina.titol = main.match(/<h1>([\s\S]*?)<\/h1>/)[1].trim();
  if (ins[2]) pagina.difficulty = DIFICULTATS[ins[2].trim()];

  const nav = main.match(/<nav class="chapter-nav"[^>]*>([\s\S]*?)<\/nav>/);
  if (nav) {
    const prev = nav[1].match(/<a href="([^"]+)" class="btn-nav btn-nav--prev">([\s\S]*?)<\/a>/);
    const next = nav[1].match(/<a href="([^"]+)" class="btn-nav btn-nav--next">([\s\S]*?)<\/a>/);
    if (prev) pagina.prev = { url: prev[1], label: prev[2].trim() };
    if (next) pagina.next = { url: next[1], label: next[2].trim() };
  }

  const pista = main.match(/<details[^>]*>\s*<summary[^>]*>💡 Pista<\/summary>([\s\S]*?)<\/details>/);
  if (pista) {
    let cos = pista[1].trim();
    if (PROJECTE.pista === 'estil-div') cos = cos.replace(/^<div[^>]*>|<\/div>$/g, '').trim();
    if (PROJECTE.pista === 'estil-p') cos = cos.replace(/^<p[^>]*>|<\/p>$/g, '').trim();
    pagina.hint = cos.split('\n').map(l => l.trim()).join('\n');
  }

  pagina.sections = [];
  const reSec = /<section class="chapter-section">([\s\S]*?)<\/section>/g;
  let s;
  while ((s = reSec.exec(main))) {
    const trossos = s[1].split(/(?=<h2>)/).filter(t => t.trim());
    const parts = trossos.map(t => {
      const p = {};
      const h2 = t.match(/^\s*<h2>([\s\S]*?)<\/h2>/);
      let resta = t;
      if (h2) { p.h2 = h2[1]; resta = t.slice(t.indexOf('</h2>') + 5); }
      // L'etiqueta acaba al primer '>' fora de cometes (data-html porta HTML a dins)
      const div = resta.match(new RegExp('<div class="' + PROJECTE.classeSimulador + '"(?:[^>"\']|"[^"]*"|\'[^\']*\')*>\\s*<\\/div>'));
      if (div) { p.simulador = simulador(div[0]); resta = resta.replace(div[0], ''); }
      const cos = desindenta(resta);
      if (cos.trim()) p.body = cos;
      return p;
    });
    pagina.sections.push(parts.length === 1 ? parts[0] : { parts });
  }
  return pagina;
}

if (require.main === module) {
  const fitxer = process.argv[2];
  if (!fitxer) { console.error('Ús: node tools/extreu-pagina.js curs/repte-N.html [--desa]'); process.exit(2); }
  const pagina = extreu(fs.readFileSync(fitxer, 'utf8'));
  const json = JSON.stringify(pagina, null, 2) + '\n';
  if (process.argv.includes('--desa')) {
    const desti = path.join(__dirname, 'pages', path.basename(fitxer).replace(/\.html$/, '.json'));
    fs.writeFileSync(desti, json);
    console.log('✅ ' + desti);
  } else process.stdout.write(json);
}

module.exports = { extreu };
