"""Finish the Astro build with its public support widget, Worker and search metadata."""
import json
import os
from html.parser import HTMLParser
from pathlib import Path
import sys
import subprocess
from urllib.parse import quote
from xml.etree import ElementTree as ET

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
    subprocess.run(['node','scripts/check-support-catalog.mjs'],cwd=ROOT,check=True)
    subprocess.run(['node','scripts/bundle-catalog-worker.mjs'],cwd=ROOT,check=True)
    # Apply the regional access policy before serving HTML, media, or an API response.
    (OUTPUT / '_routes.json').write_text(
        json.dumps({'version': 1, 'include': ['/*'], 'exclude': []}), encoding='utf-8'
    )


def write_legacy_redirects():
    source = (ROOT / 'public' / '_redirects').read_text(encoding='utf-8').strip()
    rules = []
    for line in source.splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        rules.append(line)
        path, target, status = line.split()
        locales = ('es', 'ar', 'zh', 'fr') if target == '/tpu-paint-protection-film/' else ('es', 'ar')
        for locale in locales:
            if target.startswith('/'):
                rules.append(f'/{locale}{path} /{locale}{target} {status}')
            elif path.startswith(('/account', '/cart', '/checkout')):
                rules.append(f'/{locale}{path} https://www.ynfilm.com/{locale}{path.replace("*", ":splat")} {status}')
    # Pages expects all exact paths before patterns, including the translated rules.
    rules.sort(key=lambda line: any(mark in line.split()[0] for mark in ('*', '/:')))
    (OUTPUT / '_redirects').write_text('\n'.join(rules) + '\n', encoding='utf-8')


class SearchHead(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = []
        self.alternates = {}
        self.robots = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'link' and values.get('rel') == 'canonical':
            self.canonical.append(values['href'])
        if tag == 'link' and values.get('rel') == 'alternate' and values.get('hreflang'):
            self.alternates[values['hreflang']] = values['href']
        if tag == 'meta' and values.get('name') == 'robots':
            self.robots.extend(word.strip().lower() for word in values['content'].split(','))


def write_search_files(origin):
    sitemap = ET.Element('urlset', {'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
                                    'xmlns:xhtml': 'http://www.w3.org/1999/xhtml'})
    for file in sorted(OUTPUT.rglob('index.html')):
        name = file.relative_to(OUTPUT).as_posix()
        if name.startswith(('automotive-studio/', 'support/', 'manage/')) or '404' in Path(name).parts:
            continue
        route = '/' + name.removesuffix('index.html')
        canonical = origin + quote(route, safe='/')
        head = SearchHead()
        head.feed(file.read_text(encoding='utf-8').split('</head>', 1)[0])
        if head.canonical != [canonical] or 'noindex' in head.robots or canonical not in head.alternates.values():
            raise ValueError(f'Check indexability, canonical and language links for {name}')
        url = ET.SubElement(sitemap, 'url')
        ET.SubElement(url, 'loc').text = canonical
        for tag, href in head.alternates.items():
            ET.SubElement(url, 'xhtml:link', rel='alternate', hreflang=tag, href=href)
    robots = (ROOT / 'public' / 'robots.txt').read_text(encoding='utf-8')
    (OUTPUT / 'robots.txt').write_text(robots.replace('https://yunnianfilm.com/sitemap.xml', origin + '/sitemap.xml'), encoding='utf-8')
    ET.indent(sitemap)
    ET.ElementTree(sitemap).write(OUTPUT / 'sitemap.xml', encoding='UTF-8', xml_declaration=True)


if __name__ == '__main__':
    if not (OUTPUT / 'index.html').is_file():
        sys.exit('Build the site with npm run build before packaging.')
    package_worker()
    write_legacy_redirects()
    write_search_files(os.environ.get('SITE_ORIGIN', 'https://yunnianfilm.com').rstrip('/'))
