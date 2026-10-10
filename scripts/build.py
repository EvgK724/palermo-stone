#!/usr/bin/env python3
"""Build the self-contained PALERMO app using only the Python standard library."""
import argparse
import base64
import json
from pathlib import Path
from versioning import stamp

ROOT = Path(__file__).resolve().parents[1]
SRC, DOCS = ROOT / 'src', ROOT / 'docs'

def uri(name):
    return 'data:image/png;base64,' + base64.b64encode((DOCS/'assets'/name).read_bytes()).decode()

def build(export=None):
    sources = json.loads((ROOT/'sources.json').read_text())
    data = (SRC/'data.js').read_text().replace('/*__SOURCES__*/', json.dumps(sources,ensure_ascii=False).replace('<','\\u003c'))
    parts = {
        '/*__CSS__*/': '\n'.join((SRC/name).read_text() for name in ['style.css','updater.css']),
        '__ICON__': uri('mark-96.png'),
        '<!--__STONE__-->': (DOCS/'assets/neon-verso.svg').read_text(),
        '<!--__QR__-->': (DOCS/'assets/qr.svg').read_text(),
        '/*__DATA__*/': data,
        '/*__LEARNING__*/': (SRC/'learning.js').read_text(),
        '/*__APP__*/': (SRC/'app.js').read_text(),
        '/*__UPDATER__*/': (SRC/'updater.js').read_text(),
    }
    html=(SRC/'shell.html').read_text()
    for key,value in parts.items():
        assert key in html,key
        html=html.replace(key,value)
    html=stamp(html,'palermo',DOCS)
    assert '/*__' not in html and '<!--__' not in html
    (DOCS/'index.html').write_text(html)
    offline=html.replace('<link rel="manifest" href="site.webmanifest">','')
    for name in ['favicon-32.png','apple-touch-icon.png']:
        offline=offline.replace('href="assets/'+name+'"','href="'+uri(name)+'"')
    offline=offline.replace('<a class="secondary-button" href="PALERMO.html" download>Скачать офлайн-версию ↓</a>','<p>Открыта автономная копия приложения.</p>')
    (DOCS/'PALERMO.html').write_text(offline)
    (DOCS/'.nojekyll').touch()
    if export:
        export.mkdir(parents=True,exist_ok=True)
        (export/'PALERMO.html').write_text(offline)
    print(f'Built {len(html.encode()):,} bytes; 16 recall cards; {len(sources)} sources.')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--export',type=Path);build(p.parse_args().export)
