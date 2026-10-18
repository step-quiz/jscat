#!/usr/bin/env python3
"""
comprova-enllacos.py — comprova que els enllaços cap als webs de Step Quiz
(*.step-quiz.net) d'aquest repositori funcionen.

Busca totes les adreces https://…step-quiz.net… als fitxers .html i .js del
repositori (targetes de la portada, selector «EXPLORA» de family.js, índexs…),
les visita i falla si alguna no respon bé (error 4xx/5xx o cap resposta).
El mateix fitxer és a ins, app, karelcat, pycat, jscat i htmlcat.

Ús:  python3 .github/comprova-enllacos.py      (només biblioteca estàndard)
GitHub l'executa a cada canvi a main, cada dilluns i a mà
(.github/workflows/enllacos.yml).
"""
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

ARREL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = re.compile(r"https?://(?:[a-z0-9-]+\.)*step-quiz\.net[^\s\"'<>()`\\]*", re.I)


def fitxers():
    sortida = subprocess.run(['git', '-C', ARREL, 'ls-files', '*.html', '*.js'],
                             capture_output=True, text=True).stdout
    return [f for f in sortida.split('\n') if f and 'node_modules' not in f]


def enllacos():
    trobats = {}
    for f in fitxers():
        try:
            text = open(os.path.join(ARREL, f), encoding='utf-8', errors='ignore').read()
        except OSError:
            continue
        for m in URL.finditer(text):
            url = m.group(0).rstrip('.,;:')
            if '${' in url or '+' in url:  # adreça muntada per codi: no es pot visitar tal qual
                continue
            trobats.setdefault(url, set()).add(f)
    return trobats


def estat(url):
    """Codi HTTP final (seguint redireccions) o un text d'error."""
    peticio = urllib.request.Request(url, headers={'User-Agent': 'step-quiz-comprova-enllacos/1.0'})
    for intent in range(3):
        try:
            with urllib.request.urlopen(peticio, timeout=25) as r:
                return r.status
        except urllib.error.HTTPError as e:
            if e.code < 500 or intent == 2:
                return e.code
        except Exception as e:  # sense resposta: DNS, temps esgotat...
            if intent == 2:
                return f'sense resposta ({e.__class__.__name__})'
        time.sleep(3 * (intent + 1))
    return 'sense resposta'


def main():
    trobats = enllacos()
    if not trobats:
        print('No hi ha cap enllaç a *.step-quiz.net en aquest repositori.')
        return 0
    trencats = []
    for url in sorted(trobats):
        e = estat(url)
        ok = isinstance(e, int) and e < 400
        print(f"{'✓' if ok else '✗'} {e}  {url}")
        if not ok:
            trencats.append((url, e, sorted(trobats[url])))
    print()
    if trencats:
        print(f'✗ {len(trencats)} de {len(trobats)} enllaços no funcionen:')
        for url, e, on in trencats:
            print(f'  - {url} ({e}), a: {", ".join(on)}')
            if os.environ.get('GITHUB_ACTIONS'):
                print(f'::error::Enllaç trencat ({e}): {url} — a {", ".join(on)}')
        return 1
    print(f'✓ Els {len(trobats)} enllaços a *.step-quiz.net funcionen.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
