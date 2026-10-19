// ════════════════════════════════════════════════════════
// certificat.js — Certificat en acabar el curs, i el curs següent
//
// FITXER COMÚ: ve de step-quiz/step-quiz-commons i se sobreescriu sol.
// No l'editis aquí: canvia'l a step-quiz-commons (fitxers/certificat.js) i, si
// és una cosa només d'aquest web, a comuns.json (bloc "config").
//
// La cadena de cursos és KarelCat → PyCat → JSCat. A l'índex del curs, dins de
// <section id="certificat"></section>, aquest fitxer mostra:
//   · mentre falten capítols: quants en portes i quins et falten;
//   · quan els has superat tots: el certificat (amb el nom que hi escriguis i
//     la data), un botó per imprimir-lo o desar-lo en PDF i l'enllaç al curs
//     següent.
// Un capítol compta com a superat quan té la ✓ a la barra lateral. Es llegeix el
// progrés que el curs ja desa al navegador: res no surt de l'ordinador. El nom
// només es desa en aquest navegador (localStorage), per no haver-lo de reescriure.
//
// S'ha de carregar després de capitols.js (i de progress.js).
// ════════════════════════════════════════════════════════
(function () {
  // Configuració d'aquest web (la hi posa sincronitza.py a partir de comuns.json):
  //   curs        → nom del curs (p. ex. 'KarelCat')
  //   web         → adreça que surt al peu del certificat
  //   progres     → 'karel' (KProgress de KarelCat) o 'goals' (getProgress() i el
  //                 goalId de cada capítol de CAPITOLS_DATA)
  //   finsCapitol → últim capítol que compta (els posteriors són extres)
  //   reptes      → true si el certificat diu quants reptes s'han superat
  //   seguent     → { nom, url, text } del curs següent, o null si és l'últim
  //   clauNom     → clau de localStorage on es desa el nom
  var CONFIG = {"curs": "JSCat", "web": "jscat.step-quiz.net", "progres": "goals", "finsCapitol": 12, "reptes": false, "seguent": null, "clauNom": "jscat_certificat_nom"};
  var arrel = document.getElementById('certificat');
  if (!arrel) return;

  var CAPITOLS = global('CAPITOLS_DATA') || [];
  var REPTES = global('REPTES_DATA') || [];
  var MESOS = ['de gener', 'de febrer', 'de març', "d'abril", 'de maig', 'de juny', 'de juliol',
               "d'agost", 'de setembre', "d'octubre", 'de novembre', 'de desembre'];

  // Les dades del curs poden ser a window (var) o ser constants globals d'un
  // altre <script> (const CAPITOLS_DATA = …), que no pengen de window.
  function global(nom) {
    if (window[nom]) return window[nom];
    try { return Function('return typeof ' + nom + " !== 'undefined' ? " + nom + ' : null;')(); }
    catch (e) { return null; }
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Què s'ha superat ──
  function estat() {
    var capitols = CAPITOLS.filter(function (c) {
      return typeof c.num === 'number' && (!CONFIG.finsCapitol || c.num <= CONFIG.finsCapitol) &&
             (CONFIG.progres === 'karel' || c.goalId);
    });
    var fet, repteFet;
    if (CONFIG.progres === 'karel') {
      var KP = global('KProgress');
      fet = function (c) { return !!(KP && KP.exerciciSuperat(c.num)); };
      repteFet = function (r) { return !!(KP && KP.estatRepte(r.num, r.mons).complet); };
    } else {
      var getP = global('getProgress');
      var p = getP ? getP() : {};
      fet = function (c) { return !!p[c.goalId]; };
      repteFet = function (r) { return !!(r.goalId && p[r.goalId]); };
    }
    var falten = capitols.filter(function (c) { return !fet(c); });
    return {
      total: capitols.length,
      fets: capitols.length - falten.length,
      falten: falten,
      reptes: CONFIG.reptes ? { total: REPTES.length, fets: REPTES.filter(repteFet).length } : null
    };
  }

  function llegeixNom() { try { return localStorage.getItem(CONFIG.clauNom) || ''; } catch (e) { return ''; } }
  function desaNom(n) { try { localStorage.setItem(CONFIG.clauNom, n); } catch (e) { /* bloquejat */ } }

  function avui() {
    var d = new Date();
    return d.getDate() + ' ' + MESOS[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function seguent() {
    var s = CONFIG.seguent;
    if (!s) {
      return '<p class="cert-fi">Has acabat la sèrie <strong>KarelCat → PyCat → JSCat</strong>. ' +
             'Ara ja pots fer els teus propis programes: tria una idea i comença!</p>';
    }
    return '<a class="cert-seguent" href="' + esc(s.url) + '">' +
             '<span class="cert-seguent-etiq">Següent curs</span>' +
             '<span class="cert-seguent-nom">' + esc(s.nom) + ' →</span>' +
             '<span class="cert-seguent-text">' + esc(s.text) + '</span>' +
           '</a>';
  }

  function pinta() {
    var e = estat();
    var html = '<h2 class="cert-titol">🎓 Certificat del curs</h2>';
    if (e.total === 0) { arrel.innerHTML = ''; return; }

    if (e.falten.length) {
      var pct = Math.round(100 * e.fets / e.total);
      html += '<p>Quan tinguis la ✓ a tots els capítols (la de la barra lateral), aquí tindràs ' +
              'el teu certificat de ' + esc(CONFIG.curs) + '.</p>' +
              '<div class="cert-barra" role="progressbar" aria-label="Capítols superats" aria-valuemin="0" aria-valuemax="' + e.total +
              '" aria-valuenow="' + e.fets + '"><span style="width:' + pct + '%"></span></div>' +
              '<p class="cert-compte">' + e.fets + ' de ' + e.total + ' capítols superats.</p>' +
              '<p class="cert-falten">Et falten: ' + e.falten.map(function (c) {
                return '<a href="' + esc(c.arxiu) + '">' + c.num + '. ' + esc(c.titol) + '</a>';
              }).join(' · ') + '</p>';
      arrel.innerHTML = html;
      arrel.classList.remove('cert-complet');
      return;
    }

    var reptes = e.reptes && e.reptes.total
      ? '<p class="cert-reptes">Reptes superats: ' + e.reptes.fets + ' de ' + e.reptes.total + '.</p>' : '';
    html += '<p>Has superat tots els capítols de ' + esc(CONFIG.curs) + '. Enhorabona! 🎉 ' +
            'Escriu el teu nom i imprimeix el certificat (o desa\'l en PDF des de la finestra d\'imprimir).</p>' +
            '<label class="cert-nom-etiq">El teu nom: <input type="text" class="cert-nom" maxlength="60" ' +
            'autocomplete="name" value="' + esc(llegeixNom()) + '"></label>' +
            '<div class="cert-paper">' +
              '<div class="cert-paper-etiq">Certificat</div>' +
              '<div class="cert-paper-nom"></div>' +
              '<p class="cert-paper-text">ha acabat el curs de programació <strong>' + esc(CONFIG.curs) +
              '</strong>: ' + e.total + ' capítols superats.</p>' +
              reptes.replace('cert-reptes', 'cert-paper-reptes') +
              '<div class="cert-paper-peu"><span>' + avui() + '</span><span>' + esc(CONFIG.web || '') + '</span></div>' +
            '</div>' +
            '<p><button type="button" class="cert-imprimeix">🖨 Imprimeix o desa en PDF</button></p>' +
            seguent();
    arrel.innerHTML = html;
    arrel.classList.add('cert-complet');

    var input = arrel.querySelector('.cert-nom');
    var nom = arrel.querySelector('.cert-paper-nom');
    function posaNom() {
      nom.textContent = input.value.trim() || '(el teu nom)';
      nom.classList.toggle('cert-buit', !input.value.trim());
    }
    input.addEventListener('input', function () { posaNom(); desaNom(input.value.trim()); });
    posaNom();
    arrel.querySelector('.cert-imprimeix').addEventListener('click', function () {
      if (!input.value.trim()) { input.focus(); return; }
      // Es copia el certificat a l'arrel del <body>: en imprimir només es veu aquesta còpia
      var copia = document.createElement('div');
      copia.className = 'cert-imprimir';
      copia.appendChild(arrel.querySelector('.cert-paper').cloneNode(true));
      document.body.appendChild(copia);
      document.body.classList.add('cert-imprimint');
      window.print();
    });
  }

  window.addEventListener('afterprint', function () {
    document.body.classList.remove('cert-imprimint');
    document.querySelectorAll('.cert-imprimir').forEach(function (c) { c.remove(); });
  });

  // ── Estils (aquí perquè el fitxer sigui l'únic que cal copiar) ──
  var css = document.createElement('style');
  css.textContent =
    '#certificat{max-width:760px;margin:2rem auto;padding:1.2rem 1.4rem;border:2px dashed rgba(127,127,127,.45);border-radius:12px}' +
    '#certificat.cert-complet{border-style:solid;border-color:#c9a227}' +
    '.cert-titol{margin:0 0 .6rem;font-size:1.25rem}' +
    '.cert-barra{height:10px;border-radius:5px;background:rgba(127,127,127,.25);overflow:hidden}' +
    '.cert-barra span{display:block;height:100%;background:#2e9e5b}' +
    '.cert-compte{margin:.4rem 0;font-weight:bold}' +
    '.cert-falten{font-size:.92rem;line-height:1.7}' +
    '.cert-nom-etiq{display:block;margin:.8rem 0}' +
    '.cert-nom{font:inherit;padding:.35rem .5rem;border:1px solid #888;border-radius:6px;width:min(100%,22rem)}' +
    '.cert-paper{background:#fffdf5;color:#222;border:6px double #c9a227;border-radius:6px;padding:2rem 1.5rem;text-align:center;font-family:Georgia,"Times New Roman",serif;margin:1rem 0}' +
    '.cert-paper-etiq{letter-spacing:.35em;text-transform:uppercase;color:#8a6d0b;font-size:.95rem}' +
    '.cert-paper-nom{font-size:2rem;margin:1rem 0 .4rem;border-bottom:1px solid #c9a227;display:inline-block;align-self:center;min-width:60%;padding:0 1rem .2rem}' +
    '.cert-paper-nom.cert-buit{color:#aaa;font-style:italic}' +
    '.cert-paper-text{font-size:1.1rem;margin:.6rem 0}' +
    '.cert-paper-reptes{margin:.3rem 0;color:#555}' +
    '.cert-paper-peu{display:flex;justify-content:space-between;gap:1rem;margin-top:1.6rem;font-size:.9rem;color:#555}' +
    '.cert-imprimeix{font:inherit;cursor:pointer;padding:.45rem .9rem;border-radius:8px;border:1px solid #888;background:transparent;color:inherit}' +
    '.cert-seguent{display:grid;gap:.15rem;margin-top:.8rem;padding:.9rem 1.1rem;border-radius:10px;background:#2e9e5b;color:#fff;text-decoration:none}' +
    '.cert-seguent-etiq{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;opacity:.9}' +
    '.cert-seguent-nom{font-size:1.3rem;font-weight:bold}' +
    '.cert-seguent-text{opacity:.95}' +
    '.cert-imprimir{display:none}' +
    '@media print{@page{size:A4 landscape;margin:12mm}' +
      'body.cert-imprimint>:not(.cert-imprimir){display:none!important}' +
      'body.cert-imprimint{background:#fff!important;padding:0!important;margin:0!important}' +
      'body.cert-imprimint .cert-imprimir{display:block}' +
      'body.cert-imprimint .cert-paper{margin:0;padding:22mm 14mm;min-height:150mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;break-inside:avoid;' +
      '-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'body.cert-imprimint .cert-paper-nom{font-size:2.6rem}}';
  document.head.appendChild(css);

  pinta();
  // Si l'alumne supera un capítol en una altra pestanya, l'índex es posa al dia
  window.addEventListener('storage', function (ev) { if (!ev.key || ev.key !== CONFIG.clauNom) pinta(); });
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) pinta(); });
})();
