// Reuse each English page component and its own static paths, including its product or article props.
const modules = import.meta.glob([
  '../pages/*.astro', '../pages/products/*.astro', '../pages/blog/*.astro',
  '../pages/collections-guide/*.astro',
], {eager: true}) as Record<string, {default: any, getStaticPaths?: () => any[]}>;
export const pages = Object.fromEntries(Object.entries(modules).map(([filename, page]) => {
  const name = filename.replace('../pages/', '').replace(/\.astro$/, '').replace(/(?:^|\/)index$/, '');
  return [name, page];
}));
export function translatedPaths() {
  return Object.entries(pages).flatMap(([name, page]) => {
    const variants = page.getStaticPaths ? page.getStaticPaths() : [{params: {}, props: {}}];
    return variants.map(item => ({
      path: name.replace('[slug]', item.params.slug || '') || undefined,
      props: {template: name, data: item.props},
    }));
  });
}
