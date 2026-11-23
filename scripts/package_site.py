"""Finish the Astro build with its public support widget, Worker and search metadata."""
import json
import os
from pathlib import Path
import re
import sys
import subprocess
from urllib.parse import quote
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist'


def render_worker(support, knowledge):
    template = (support / 'worker.mjs').read_text(encoding='utf-8')
    lookup_import = "import {mentionedModels, queryWindowFilms} from './catalogue-query.mjs';"
    if template.count(lookup_import) != 1:
        raise ValueError('Worker catalogue import must occur once')
    lookup = (support / 'catalogue-query.mjs').read_text(encoding='utf-8')
    lookup_body = lookup.replace('export function ', 'function ')
    bundled = ("const {mentionedModels, queryWindowFilms} = (() => {\n" + lookup_body +
               "\nreturn {mentionedModels, queryWindowFilms};\n})();")
    template = template.replace(lookup_import, bundled)
    marker = '__YUNNIAN_PUBLIC_KNOWLEDGE__'
    if template.count(marker) != 1:
        raise ValueError('Worker knowledge placeholder must occur once')
    return template.replace(marker, json.dumps(knowledge, ensure_ascii=False))


def package_worker():
    support = ROOT / 'support'
    service = ROOT.parent / 'ai-customer-service'
    if (service / 'public_catalogue.py').is_file():
        sys.path.insert(0, str(service))
        from public_catalogue import snapshot
        from chat_assistant import INSTRUCTIONS
        knowledge = snapshot(INSTRUCTIONS)
    else:
        knowledge = json.loads((support / 'catalog.json').read_text(encoding='utf-8'))
    worker = render_worker(support, knowledge)
    subprocess.run(['node', '--input-type=module', '--check'], input=worker, text=True, check=True)
    (OUTPUT / '_worker.js').write_text(worker, encoding='utf-8')
    (OUTPUT / '_routes.json').write_text(
        json.dumps({'version': 1, 'include': ['/support/api/*'], 'exclude': []}), encoding='utf-8'
    )


def write_legacy_redirects():
    source = (ROOT / 'public' / '_redirects').read_text(encoding='utf-8').strip()
    rules = [source]
    for line in source.splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        path, target, status = line.split()
        for locale in ('es', 'ar'):
            if target.startswith('/'):
                rules.append(f'/{locale}{path} /{locale}{target} {status}')
            elif path.startswith(('/account', '/cart', '/checkout')):
                rules.append(f'/{locale}{path} https://www.ynfilm.com/{locale}{path.replace("*", ":splat")} {status}')
    (OUTPUT / '_redirects').write_text('\n'.join(rules) + '\n', encoding='utf-8')


def write_search_files(origin):
    urls = []
    for file in sorted(OUTPUT.rglob('*.html')):
        name = file.relative_to(OUTPUT).as_posix()
        if name.startswith(('automotive-studio/', 'support/')) or '404' in Path(name).parts or name == '404.html':
            continue
        route = '/' + name.removesuffix('index.html')
        canonical = origin + quote(route, safe='/')
        markup = file.read_text(encoding='utf-8')
        if 'rel="canonical"' not in markup or f'href="{canonical}"' not in markup:
            raise ValueError(f'Check the canonical URL for {name}')
        markup = re.sub(r'<meta name="robots" content="noindex,nofollow"\s*/?\s*>',
                        '<meta name="robots" content="index,follow">', markup)
        file.write_text(markup, encoding='utf-8')
        urls.append(canonical)
    (OUTPUT / 'robots.txt').write_text(
        f'User-agent: *\nAllow: /\nDisallow: /automotive-studio/viewer/\nSitemap: {origin}/sitemap.xml\n',
        encoding='utf-8',
    )
    locations = ''.join(f'  <url><loc>{escape(url)}</loc></url>\n' for url in sorted(urls))
    (OUTPUT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + locations + '</urlset>\n',
        encoding='utf-8',
    )


if __name__ == '__main__':
    if not (OUTPUT / 'index.html').is_file():
        sys.exit('Build the site with npm run build before packaging.')
    package_worker()
    write_legacy_redirects()
    write_search_files(os.environ.get('SITE_ORIGIN', 'https://yunnianfilm.com').rstrip('/'))
