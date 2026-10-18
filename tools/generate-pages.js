#!/usr/bin/env node
// ════════════════════════════════════════════════════════
// tools/generate-pages.js — Generador de pàgines del curs
//
// Llegeix descripcions de pàgines en JSON (tools/pages/*.json) i genera els
// fitxers HTML corresponents a curs/*.html, amb l'esquelet que fa servir
// aquest curs (bloc PROJECTE, a sota).
//
// Ús:
//   node tools/generate-pages.js                    # genera tot a curs/
//   node tools/generate-pages.js --only repte-6     # només una pàgina
//   node tools/generate-pages.js --dry-run          # no escriu, només mostra
//   node tools/generate-pages.js --comprova         # no escriu: diu si cada JSON
//                                                   # produeix la pàgina que hi ha a curs/
//   node tools/generate-pages.js --out /tmp/        # canvia el directori de sortida
//   node tools/generate-pages.js --input other/     # canvia el directori d'entrada
//
// El mateix fitxer és a PyCat, JSCat i GeoCat: només hi canvia el bloc PROJECTE
// (i, a GeoCat, el que genera el simulador, que és un applet de GeoGebra).
// El format del JSON és a tools/README.md.
// ════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// ── Què té de propi aquest curs ─────────────────────────
const PROJECTE = {
  nom: 'JSCat',
  // 'injectat': <body data-pagina data-num> i només el <main>; capitols.js hi
  //             afegeix la capçalera i la barra lateral (initCursPage).
  // 'complet':  la pàgina porta escrites la capçalera i la barra lateral.
  esquelet: 'complet',
  headExtra: [],
  // Scripts del final, en ordre: un nom de fitxer, o { inline: page => codi }.
  scripts: [
    'progress.js',
    'capitols.js',
    { inline: page => `  injectCursLogo();
  ${page.type === 'capitol' ? 'renderSidebar' : 'renderReptesSidebar'}(${page.num});
  renderSimuladors();
  initSidebarToggle();` },
    '../footer.js',
  ],
  insigniaAmbClasse: false,     // true: class="badge--facil"; false: style="background…"
  // Pista dels reptes: 'classe' (<details class="pista">), 'estil-div' o 'estil-p'
  // (estils en línia, amb el text dins d'un <div> o d'un <p>).
  pista: 'estil-p',
  // aria-label de <nav class="chapter-nav">: un text, null (cap) o page => text
  navAria: page => (page.type === 'capitol' ? 'Navegació entre capítols' : null),
  // Capçalera i barra lateral (esquelet 'complet'). A JSCat la barra lateral és
  // la dels capítols també a les pàgines dels reptes.
  capcalera: page => `<header class="topbar">
  <button id="sidebar-toggle" aria-label="Mostra/amaga els capítols" aria-expanded="false">☰</button>
  <div class="logo">
    <span class="logo-icon"></span>
    <span>JSCat</span>
  </div>
  <nav class="topbar-nav">
    <a href="capitol-1.html" class="topbar-nav-link${page.type === 'capitol' ? ' active' : ''}">Capítols</a>
  </nav>
  <div class="topbar-actions"></div>
</header>

<div class="curs-layout">
  <div id="sidebar-overlay" aria-hidden="true"></div>
  <nav id="sidebar" class="curs-sidebar" aria-label="Capítols del curs">
    <div id="sidebar-nav"></div>
  </nav>`,
  // Simulador: classe del <div> i atributs data-* que entén aquest curs (en ordre).
  classeSimulador: 'simulador',
  atributsSimulador: ['code', 'html', 'mode', 'stdin', 'expected', 'tests', 'testcode', 'interactive', 'readonly', 'goal-id', 'height'],
  alcadaSimulador: 320,         // data-height si el JSON no en diu cap
};

// ── Parser d'arguments CLI ───────────────────────────────
function parseArgs(argv) {
  const args = { dryRun: false, comprova: false, only: null, input: null, output: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run')       args.dryRun = true;
    else if (a === '--comprova') args.comprova = true;
    else if (a === '--only')     args.only   = argv[++i];
    else if (a === '--input')    args.input  = argv[++i];
    else if (a === '--out')      args.output = argv[++i];
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
    else { console.error('Arg desconegut:', a); printHelp(); process.exit(1); }
  }
  return args;
}

function printHelp() {
  console.log('Ús: node tools/generate-pages.js [opcions]');
  console.log('  --only NAME    Genera només aquesta pàgina (p.ex. repte-6)');
  console.log('  --dry-run      No escriu, mostra el contingut que generaria');
  console.log('  --comprova     No escriu: comprova que cada JSON produeix la pàgina de curs/');
  console.log('  --input DIR    Directori d\'entrada (defecte: tools/pages)');
  console.log('  --out DIR      Directori de sortida (defecte: curs)');
  console.log('  --help         Mostra aquesta ajuda');
}

// ── Helpers ─────────────────────────────────────────────
function escAttr(s) {
  // Escapa per atribut amb cometes dobles. Preserva salts de línia.
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escAttrSingle(s) {
  // Escapa per atribut amb cometes simples (utilitzat per data-tests JSON).
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}

// ── Insígnies dels reptes segons dificultat ─────────────
const DIFFICULTY_BADGE = {
  facil:     { color: '#d1fae5', fg: '#065f46', label: 'Fàcil' },
  intermedi: { color: '#fef3c7', fg: '#92400e', label: 'Intermedi' },
  mitja:     { color: '#fef3c7', fg: '#92400e', label: 'Mitjà' },      // GeoCat
  dificil:   { color: '#fee2e2', fg: '#991b1b', label: 'Difícil' },
};

// ── Genera el bloc del simulador des d'un objecte config ────
// Cada atribut de PROJECTE.atributsSimulador, si el JSON el porta, es converteix
// en data-<atribut> (els noms del JSON són en camelCase: goal-id → goalId).
function nomJson(atribut) { return atribut.replace(/-(\w)/g, (_, c) => c.toUpperCase()); }

function renderSimulador(sim) {
  if (!sim) return '';
  const parts = ['      <div class="' + PROJECTE.classeSimulador + '"'];
  for (const at of PROJECTE.atributsSimulador) {
    let v = sim[nomJson(at)];
    if (at === 'height' && v == null) v = PROJECTE.alcadaSimulador;
    if (v == null || v === false) continue;
    if (at === 'tests') {
      // data-tests és JSON; amb cometes simples externes com les pàgines existents
      const json = typeof v === 'string' ? v : JSON.stringify(v);
      parts.push("           data-tests='" + escAttrSingle(json) + "'");
    } else {
      parts.push('           data-' + at + '="' + escAttr(v === true ? 'true' : v) + '"');
    }
  }
  parts[parts.length - 1] += '>';
  parts.push('      </div>');
  return parts.join('\n');
}

// ── Genera una <section> ─────────────────────────────────
// Cada entrada de "sections" pot ser:
//   A) Simple:  { h2, body, simulador }           → una secció amb un h2
//   B) Agrupada: { parts: [ {h2, body, simulador}, ... ] }  → una secció amb múltiples h2s
// No re-indentem el contingut de `body` perquè pot contenir blocs <pre>.
function renderSection(section) {
  const lines = ['    <section class="chapter-section">'];
  const parts = Array.isArray(section.parts) ? section.parts : [section];
  parts.forEach((p, idx) => {
    if (idx > 0) lines.push('');
    if (p.h2)   lines.push('      <h2>' + p.h2 + '</h2>');
    if (p.body) lines.push(p.body.trim());
    if (p.simulador) {
      lines.push('');
      lines.push(renderSimulador(p.simulador));
    }
  });
  lines.push('    </section>');
  return lines.join('\n');
}

// ── Genera <nav class="chapter-nav"> ─────────────────────
function renderNav(prev, next, page) {
  if (!prev && !next) return '';
  const aria = typeof PROJECTE.navAria === 'function' ? PROJECTE.navAria(page) : PROJECTE.navAria;
  const lines = ['    <nav class="chapter-nav"' + (aria ? ' aria-label="' + aria + '"' : '') + '>'];
  if (prev) lines.push('      <a href="' + prev.url + '" class="btn-nav btn-nav--prev">' + prev.label + '</a>');
  if (next) lines.push('      <a href="' + next.url + '" class="btn-nav btn-nav--next">' + next.label + '</a>');
  lines.push('    </nav>');
  return lines.join('\n');
}

// ── Genera la insígnia de capçalera ──────────────────────
function renderBadge(page) {
  if (page.type === 'capitol') return '      <span class="chapter-badge">Capítol ' + page.num + '</span>';
  const diff = page.difficulty && DIFFICULTY_BADGE[page.difficulty];
  if (!diff) return '      <span class="chapter-badge">⚡ Repte ' + page.num + '</span>';
  const text = '⚡ Repte ' + page.num + ' — ' + diff.label;
  return PROJECTE.insigniaAmbClasse
    ? '      <span class="chapter-badge badge--' + page.difficulty + '">' + text + '</span>'
    : '      <span class="chapter-badge" style="background: ' + diff.color + '; color: ' + diff.fg + ';">' + text + '</span>';
}

// ── Genera <details> de pista (només reptes) ────────────
function renderHint(hint) {
  if (!hint) return '';
  if (PROJECTE.pista === 'classe') {
    return `    <details class="pista">
      <summary>💡 Pista</summary>
      ${hint.trim().replace(/\n/g, '\n      ')}
    </details>`;
  }
  if (PROJECTE.pista === 'estil-p') {
    // El text de la pista va directament dins d'un <p> amb estils (sense <p> propi al JSON)
    return `    <details style="margin-top: 1.5rem;">
      <summary style="cursor:pointer; font-size:0.82rem; color:var(--muted);">💡 Pista</summary>
      <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--muted);">
        ${hint.trim().replace(/^<p>|<\/p>$/g, '').replace(/\n/g, '\n        ')}
      </p>
    </details>`;
  }
  return `    <details style="margin-top: 1.5rem;">
      <summary style="cursor:pointer; font-size:0.82rem; color:var(--muted);">💡 Pista</summary>
      <div style="margin-top:0.5rem; font-size:0.85rem; color:var(--muted);">
        ${hint.trim().replace(/\n/g, '\n        ')}
      </div>
    </details>`;
}

// ── Scripts finals ───────────────────────────────────────
function renderScripts(page) {
  return PROJECTE.scripts.map(s => typeof s === 'string'
    ? `<script src="${s}"></script>`
    : '<script>\n' + s.inline(page) + '\n</script>').join('\n');
}

// ── Contingut de <main> ─────────────────────────────────
function renderContingut(page) {
  const sections = (page.sections || []).map(renderSection).join('\n\n');
  const nav  = renderNav(page.prev, page.next, page);
  const hint = renderHint(page.hint);
  const lead = page.lead ? '\n      <p class="chapter-lead">' + page.lead + '</p>' : '';
  const cos = `    <header class="chapter-header">
${renderBadge(page)}
      <h1>${page.titol}</h1>${lead}
    </header>

${sections}

${hint ? hint + '\n\n' : ''}${nav}`;
  // Els capítols porten el contingut dins de <div class="chapter-content-inner">
  return page.type === 'capitol' ? `    <div class="chapter-content-inner">\n${cos}\n    </div>` : cos;
}

// ── Capçalera i barra lateral (només esquelet 'complet') ──
function renderCapcalera(page) {
  const isCapitol = page.type === 'capitol';
  const togglelabel  = isCapitol ? 'Mostra/amaga els capítols' : 'Mostra/amaga els reptes';
  const sidebarLabel = isCapitol ? 'Capítols del curs' : 'Reptes del curs';
  if (PROJECTE.capcalera) return PROJECTE.capcalera(page, { togglelabel, sidebarLabel });
  const label = (isCapitol ? 'Capítol ' : 'Repte ') + page.num;
  return `<header class="curs-header">
  <button id="sidebar-toggle" aria-label="${togglelabel}" aria-expanded="false">☰</button>
  <span class="curs-header-logo">
    <span class="logo-icon"></span>
    ${PROJECTE.nom}
  </span>
  <nav class="curs-nav">
    <a href="capitol-1.html"${isCapitol ? ' class="active"' : ''}>Capítols</a>
    <a href="repte-1.html"${isCapitol ? '' : ' class="active"'}>Reptes</a>
    <a href="../index.html">Simulador</a>
  </nav>
  <span class="curs-header-title">${label} — ${page.titol}</span>
  <div class="curs-header-actions"></div>
</header>

<div class="curs-layout">
  <div id="sidebar-overlay" aria-hidden="true"></div>
  <nav id="sidebar" class="curs-sidebar" aria-label="${sidebarLabel}">
    <div id="sidebar-nav"></div>
  </nav>`;
}

// ── Genera la pàgina HTML completa ───────────────────────
function renderPage(page) {
  const isCapitol = page.type === 'capitol';
  const label = isCapitol ? 'Capítol ' + page.num : 'Repte ' + page.num;
  const head = `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${label} — ${page.titol} | ${PROJECTE.nom}</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="curs.css">${PROJECTE.headExtra.map(l => '\n  ' + l).join('')}
</head>`;
  if (PROJECTE.esquelet === 'injectat') {
    return `${head}
<body data-pagina="${page.type}" data-num="${page.num}">

<main class="curs-content">

${renderContingut(page)}
</main>

${renderScripts(page)}
</body>
</html>
`;
  }
  return `${head}
<body>

${renderCapcalera(page)}

  <main class="curs-content">

${renderContingut(page)}

  </main>
</div>

${renderScripts(page)}

</body>
</html>
`;
}

// ── Comparació amb la pàgina publicada (--comprova) ──────
// Converteix l'HTML en una seqüència de peces comparables: les etiquetes amb els
// atributs descodificats (data-tests com a JSON), el text amb els espais
// col·lapsats i els <pre> tal qual. Així no compten la indentació ni els salts de
// línia de l'HTML, però sí qualsevol canvi de contingut, d'atributs o de codi.
function descodifica(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

function peces(html) {
  const out = [];
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  // Una etiqueta acaba al primer '>' que no és dins d'un valor entre cometes
  // (data-html porta HTML sencer a dins).
  const re = /<pre\b[\s\S]*?<\/pre>|<\/?[a-zA-Z](?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+/g;
  let m;
  while ((m = re.exec(html))) {
    const t = m[0];
    if (t.startsWith('<pre')) { out.push('PRE ' + descodifica(t)); continue; }
    if (t.startsWith('<')) {
      const nom = t.match(/^<\/?([a-zA-Z][\w-]*)/)[0];
      const attrs = [];
      const ra = /([\w:-]+)(?:=("([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      const resta = t.slice(nom.length).replace(/\/?>$/, '');
      let a;
      while ((a = ra.exec(resta))) {
        let v = descodifica(a[3] != null ? a[3] : a[4] != null ? a[4] : a[5] != null ? a[5] : '');
        if (a[1] === 'data-tests') { try { v = JSON.stringify(JSON.parse(v)); } catch (e) { /* tal qual */ } }
        attrs.push(a[1] + '=' + JSON.stringify(v));
      }
      out.push(nom + (attrs.length ? ' ' + attrs.sort().join(' ') : '') + '>');
      continue;
    }
    const text = descodifica(t).replace(/\s+/g, ' ').trim();
    if (text) out.push('TEXT ' + text);
  }
  return out;
}

function diferencia(a, b) {
  const pa = peces(a), pb = peces(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] !== pb[i]) return { i, publicada: pa[i], generada: pb[i] };
  }
  return null;
}

// ── Determina el nom del fitxer de sortida ──────────────
function outputFilename(page) {
  return (page.type === 'capitol' ? 'capitol-' : 'repte-') + page.num + '.html';
}

// ── Valida una pàgina abans de generar-la ──────────────
function validatePage(page, sourceFile) {
  const errs = [];
  if (!page.type || (page.type !== 'capitol' && page.type !== 'repte'))
    errs.push('type ha de ser "capitol" o "repte"');
  if (typeof page.num !== 'number') errs.push('num ha de ser un número');
  if (!page.titol) errs.push('titol és obligatori');
  if (!Array.isArray(page.sections)) errs.push('sections ha de ser un array');
  if (errs.length) {
    console.error('❌ ' + sourceFile + ':');
    errs.forEach(e => console.error('    ' + e));
    return false;
  }
  return true;
}

// ── Main ────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(__dirname, '..');
  const inputDir  = args.input  ? path.resolve(args.input)  : path.join(root, 'tools', 'pages');
  const outputDir = args.output ? path.resolve(args.output) : path.join(root, 'curs');

  if (!fs.existsSync(inputDir)) {
    console.error('❌ No existeix el directori d\'entrada:', inputDir);
    process.exit(1);
  }
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json')).sort();
  if (!files.length) {
    console.error('❌ No s\'han trobat fitxers JSON a', inputDir);
    process.exit(1);
  }

  let generated = 0, skipped = 0, failed = 0;
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf8'));
    } catch (e) {
      console.error('❌ JSON invàlid a', file, '—', e.message);
      failed++;
      continue;
    }
    if (!validatePage(data, file)) { failed++; continue; }

    const outName = outputFilename(data);
    if (args.only && outName !== args.only + '.html' && data.num + '' !== args.only) { skipped++; continue; }

    const html = renderPage(data);
    const outPath = path.join(outputDir, outName);

    if (args.comprova) {
      if (!fs.existsSync(outPath)) { console.log('🆕 ' + outName + ': encara no existeix (es crearà en generar)'); generated++; continue; }
      const d = diferencia(fs.readFileSync(outPath, 'utf8'), html);
      if (d) {
        // Mostra el tros on comencen a diferir
        const a = String(d.publicada), b = String(d.generada);
        let k = 0;
        while (k < a.length && a[k] === b[k]) k++;
        const tros = s => (k > 50 ? '…' : '') + s.slice(Math.max(0, k - 50), k + 70);
        console.error(`❌ ${file} → ${outName}: no coincideix amb la pàgina publicada`);
        console.error('     publicada: ' + tros(a));
        console.error('     generada:  ' + tros(b));
        failed++;
      } else {
        console.log('✅ ' + file + ' → ' + outName + ': coincideix');
        generated++;
      }
      continue;
    }
    if (args.dryRun) {
      console.log('── DRY-RUN: ' + outPath + ' (' + html.length + ' bytes) ──');
      console.log(html.substring(0, 200) + '…');
    } else {
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log('✅ ' + outPath);
    }
    generated++;
  }

  const verb = args.comprova ? 'comprovades' : 'generades';
  console.log('\n' + generated + ' ' + verb +
    (skipped ? ', ' + skipped + ' omeses' : '') +
    (failed ? ', ' + failed + ' amb errors' : '') + '.');
  if (failed) process.exit(1);
}

if (require.main === module) main();
module.exports = { renderPage, peces, diferencia, PROJECTE };
