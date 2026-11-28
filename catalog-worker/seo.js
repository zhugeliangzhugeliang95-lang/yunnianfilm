import {demand, json, now, readJSON} from './common.js';
import {copyFor, imagePath, locales, localeValue} from '../public/catalog-ui/product-view.js';

const empty = () => ({copy:{}, images:{}});
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function text(value, limit) {
  demand(value == null || typeof value === 'string', 400, 'SEO 字段需要填写文字。');
  const result = (value || '').trim();
  demand(result.length <= limit, 400, '文字超过字段长度，请缩短后保存。');
  return result;
}

function cleanSEO(input, allowed) {
  demand(record(input) && record(input.copy) && record(input.images), 400, 'SEO 资料格式有误。');
  const doc = empty();
  for (const lang of locales) {
    const row = input.copy[lang];
    const title = text(row?.title, 240), description = text(row?.description, 1200);
    if (title || description) doc.copy[lang] = {title, description};
  }
  for (const [src, translations] of Object.entries(input.images)) {
    demand(imagePath(src) && allowed.has(src) && record(translations), 400, '产品图册已变更，请重新打开后核对图片。');
    const values = locales.map(lang => [lang, text(translations[lang], 600)]).filter(([,alt]) => alt);
    if (values.length) doc.images[src] = Object.fromEntries(values);
  }
  return doc;
}

function contextFor(live, draft, extras) {
  const product = live || draft;
  const photos = new Map();
  const collect = (p, visible) => {
    if (!p) return;
    for (const image of [...p.gallery, ...p.variants]) {
      if (!imagePath(image.src) || photos.has(image.src)) continue;
      const labels = Object.fromEntries(locales.map(l => [l, localeValue(image.labels,l) || image.caption || image.value || '']));
      photos.set(image.src, {src:image.src, labels, visible});
    }
  };
  collect(live,true);
  for (const im of extras || []) {
    if (imagePath(im.src) && !photos.has(im.src)) photos.set(im.src,{...im,visible:true});
  }
  collect(draft,false);
  const defaults = Object.fromEntries(locales.map(l => {
    const copy = copyFor(product,l);
    return [l,{title:copy.name ? copy.name+' | YUNNIAN' : '',description:copy.description,name:copy.name}];
  }));
  return {defaults, photos:[...photos.values()], live:!!live};
}

export async function seoDocument(req, db, base, slug) {
  const [product, row] = await Promise.all([
    db.prepare("SELECT draft,live FROM catalog_documents WHERE kind='product' AND id=?").bind(slug).first(),
    db.prepare('SELECT draft,live,revision FROM catalog_seo WHERE slug=?').bind(slug).first(),
  ]);
  const seed = base.bySlug.get(slug);
  const live = product?.live ? JSON.parse(product.live) : seed;
  const draft = product?.draft ? JSON.parse(product.draft) : null;
  demand(live || draft,404,'找不到该产品。');
  const extra = seed?.category === live?.category ? base.detailPhotos?.[slug] : null;
  const context = contextFor(live, draft, extra);
  if (req.method === 'GET') {
    const stored = new URL(req.url).searchParams.get('version') === 'live' ? row?.live : row?.draft;
    return json({content:stored ? JSON.parse(stored) : empty(), context, revision:row?.revision || 0,
      published:!!row?.live, pending:!!row && row.draft !== (row.live || JSON.stringify(empty()))});
  }
  demand(req.method === 'PUT',405,'此操作不支持。');
  const input = await readJSON(req,750000);
  demand(['publish','draft'].includes(input?.mode) && Number.isSafeInteger(input.revision) && input.revision>=0,400,'请刷新后重试。');
  // An asset can be removed or reordered between edits. Keep prior descriptions tied to their original file.
  const allowed = new Set(context.photos.map(p => p.src));
  for (const stored of [row?.draft,row?.live]) if (stored) for (const src of Object.keys(JSON.parse(stored).images)) allowed.add(src);
  const data = JSON.stringify(cleanSEO(input.content,allowed)), publishing = input.mode === 'publish';
  demand(new TextEncoder().encode(data).length <= 700000,413,'此产品的 SEO 文字过多，请精简后保存。');
  const saved = input.revision === 0
    ? await db.prepare('INSERT INTO catalog_seo(slug,draft,live,revision,updated) VALUES(?,?,?,1,?) ON CONFLICT(slug) DO NOTHING RETURNING revision').bind(slug,data,publishing?data:null,now()).first()
    : await db.prepare('UPDATE catalog_seo SET draft=?,live=CASE WHEN ? THEN ? ELSE live END,revision=revision+1,updated=? WHERE slug=? AND revision=? RETURNING revision').bind(data,publishing?1:0,data,now(),slug,input.revision).first();
  demand(saved,409,'另一位编辑已保存此产品的 SEO，请重新打开后核对。');
  return json({revision:saved.revision,published:publishing || !!row?.live,pending:!publishing && data!==(row?.live || JSON.stringify(empty()))});
}

export async function readSEO(db,slug,preview) {
  const query = preview ? 'SELECT draft AS content FROM catalog_seo WHERE slug=?' : 'SELECT live AS content FROM catalog_seo WHERE slug=? AND live IS NOT NULL';
  const row = await db.prepare(query).bind(slug).first();
  return row?.content ? JSON.parse(row.content) : null;
}
