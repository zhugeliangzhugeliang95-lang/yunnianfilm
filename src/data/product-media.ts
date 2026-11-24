import archive from './source-product-details.json';
import reviewedGalleries from './gallery.json';
import references from './product-reference-images.json';

export type MediaKind = 'variant' | 'series' | 'spec';
export interface GalleryImage {
  src: string;
  caption: string;
  kind: MediaKind;
}
export interface VariantImage {
  value: string;
  src: string;
  kind: MediaKind;
  galleryIndex: number;
}
interface ProductInput {
  slug: string;
  name: string;
  category: string;
  image?: string;
  categoryArtwork?: boolean;
  options: string[];
}
interface ArchiveSheet {
  variants: {title: string}[];
  images: {src: string; variants: string[]; caption: string}[];
}

// These storefront featured-image assignments disagree with the product name printed
// on the manufacturer's own image. Discard the assignment, even if there is no replacement.
const incorrectAssignments = new Set([
  '96c51c16ac4d9fcf', 'a5030509d76653a9', 'd117ff97f1225818',
  '3025f60ce143f856', '0a05b53e38f667b6', 'd06417861468be9a',
  '8103cbb12b158227', '9a822954aadb3bc8', '9944f7340fd265fb', '0518b0dde7376228',
  'f6534b68a0e386c7', '1f0d3b680b036740', 'ae5ad50362905cf8', '75aa3a8dbb6bfa51',
  'a3fe5f5e2256d015', '2c9b3691b656653c', '81e781c991dad0c4', '858786790318e3ae',
  '3a6ab1d3528ce66b', 'c7b0e6d01210db58', '206929de42a47afe',
]);
const card = (file: string) => `/automotive-studio/viewer/catalog/cards/${file}.webp`;
const legacy = (file: string) => `/images/legacy/${file}.webp`;

// Replacement images are taken from the identified printed TPU card or another
// owner storefront image that actually shows the named product. PET has its own range.
const confirmedReplacements: Record<string, Record<string, string>> = {
  'classic-color-ppf': {
    'Akha Gold': card('aka-gold-d3b4e9ef6851'),
    'Hardlin Green': card('hadley-green-95faf87e18dc'),
    'Starry Grey Wraith': card('starlight-phantom-gray-c2165272aceb'),
    'Paint Metallic Midnight Purple': legacy('d117ff97f1225818'),
  },
  'liquid-metal-color-ppf': {
    'Byron Bay Blue': legacy('206929de42a47afe'),
    'Liquid Metal Coffee': card('liquid-metal-coffee-0aef30cf5dd8'),
    'Liquid Metallic Titanium Silver': legacy('96c51c16ac4d9fcf'),
    'Liquid Metal Cherry Red': card('liquid-metal-cherry-red-a6ab7cf9d8ab'),
    'Liquid Metal Mousse White': card('liquid-metal-mousse-white-2051220a2a60'),
  },
  'magic-pearl-color-ppf': {'Light Blue Pearl': legacy('8103cbb12b158227')},
  'glossy-crystal-color-ppf': {
    'Paint Chocolate': card('paint-finish-chocolate-c9700b76d301'),
    'Battle Green': legacy('c7b0e6d01210db58'),
    'Neptune Blue': card('neptune-blue-a5c2e5f3552a'),
    'Crystal Army Green': card('crystal-army-green-73b00689e090'),
    'Racing Green': card('racing-green-05a05768c9c9'),
  },
  'laser-color-ppf': {
    'White laser finish': card('laser-white-1e067e4d261f'),
    'Black laser finish': card('laser-black-2d7fd6b5da0d'),
    'Silver laser finish': card('laser-silver-d86165b53c99'),
  },
  'chrome-color-ppf': {
    'Silver chrome finish': card('tpu-chrome-silver-8e025c4fa9f5'),
    'Green chrome finish': card('green-chrome-3bf00686080d'),
    'Gold chrome finish': card('gold-chrome-0de7d0eea927'),
  },
  // Original printed samples and model labels, extracted from the four panels
  // of the owner's full comparison sheet /images/legacy/1ca8e68b2fd3c564.webp.
  'motorcycle-ebike-protective-film': {
    'YN15D8': '/images/gallery/motorcycle-yn15d8.webp',
    'YN10D-M': '/images/gallery/motorcycle-yn10d-m.webp',
    'YN10T0': '/images/gallery/motorcycle-yn10t0.webp',
    'YN10D0': '/images/gallery/motorcycle-yn10d0.webp',
  },
};
const categoryArtwork: Record<string, string> = {
  'Clear PPF': 'tpu-ppf-category.webp', 'Color PPF': 'tpu-color-ppf-category.webp',
  'PET color wraps': 'pet-color-wrap-category.webp', 'Window film': 'window-film-category.webp',
  'Architectural film': 'architectural-film-category.webp', 'Headlight films': 'headlight-film-category.webp',
  'Windshield protection': 'window-film-category.webp',
};
const sheetsBySlug: Record<string, ArchiveSheet[]> = archive;
const olderGalleries: Record<string, {variant: string; image: string}[]> = reviewedGalleries;
const referenceFiles: Record<string, Record<string, string>> = references;

function isProductOption(value: string) {
  return value && value !== 'Default Title' && !/^request\b|\bsample request$/i.test(value);
}

export function productMedia(product: ProductInput): {gallery: GalleryImage[]; variants: VariantImage[]} {
  const {slug} = product;
  const sheets = sheetsBySlug[slug] ?? [];
  const isColorSeries = ['Color PPF', 'PET color wraps'].includes(product.category);
  const catalogueOptions = isColorSeries ? sheets.flatMap(sheet => sheet.variants.map(v => v.title)) : [];
  const values = [...new Set([...product.options, ...catalogueOptions].filter(isProductOption))];
  const images = sheets.flatMap(sheet => sheet.images);
  const gallery: GalleryImage[] = [];
  const galleryIndex = new Map<string, number>();
  function addImage(src: string, caption: string, kind: MediaKind) {
    const existing = galleryIndex.get(src);
    if (existing !== undefined) return existing;
    galleryIndex.set(src, gallery.length);
    return gallery.push({src, caption, kind}) - 1;
  }

  // Show original series imagery in the rail. Cards with variant assignments
  // enter the rail only through a verified, currently offered option below.
  const seriesImages = images.filter(image => image.variants.length !== 1);
  const first = slug === 'lubrizol-sm301-ppf'
    ? seriesImages.find(image => image.src === legacy('eda272148d33144a')) ?? seriesImages[0]
    : seriesImages[0];
  if (first) addImage(first.src, 'Product overview', 'series');
  else if (slug === 'tpu-silver-sunroof-film') {
    // Diagram published in the company's silver-plated sunroof film journal article.
    addImage(legacy('edd7a22cff63fac2'), 'Silver-coated sunroof film illustration', 'spec');
  }
  else if (product.image) {
    const src = product.image.startsWith('/') ? product.image : `/images/${product.image}`;
    addImage(src, product.categoryArtwork ? 'Category illustration' : 'Product overview', product.categoryArtwork ? 'spec' : 'series');
  }
  for (const image of seriesImages.filter(image => image !== first)) {
    addImage(image.src, `Series image ${gallery.length + 1}`, 'series');
  }

  const photos = new Map<string, {src: string; kind: MediaKind}>();
  for (const image of images) {
    if (incorrectAssignments.has(image.src.split('/').pop()!.replace('.webp', ''))) continue;
    for (const value of image.variants) {
      if (!photos.has(value)) photos.set(value, {src: image.src, kind: image.variants.length > 1 ? 'series' : 'variant'});
    }
  }
  for (const item of olderGalleries[slug] ?? []) {
    if (!photos.has(item.variant)) photos.set(item.variant, {src: `/images/${item.image}`, kind: 'variant'});
  }
  for (const [value, src] of Object.entries(confirmedReplacements[slug] ?? {})) {
    photos.set(value, {src, kind: 'variant'});
  }
  const seriesFallback = gallery[0];
  const variants: VariantImage[] = [];
  for (const value of values) {
    const reference = referenceFiles[slug]?.[value];
    const media = photos.get(value) ?? (reference ? {src: reference, kind: 'spec' as const} : seriesFallback);
    if (!media) continue;
    const caption = media.kind === 'series' ? 'Shared series image' : value;
    const index = addImage(media.src, caption, media.kind);
    variants.push({value, src: media.src, kind: media.kind, galleryIndex: index});
  }
  if (!gallery.length && categoryArtwork[product.category]) {
    addImage(`/images/${categoryArtwork[product.category]}`, 'Category illustration', 'spec');
  }
  return {gallery, variants};
}
