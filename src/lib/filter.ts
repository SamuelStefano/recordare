import type { Filters, Sort } from '../hooks/useFilters';
import type { Product } from './catalog';
import type { Lang } from './i18n';
import { colorLabel, finishLabel, productDescription, productName } from './labels';

// Busca sem acento e sem caixa: quem digita "medalhao" tem que achar "Medalhão".
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function haystack(product: Product, lang: Lang): string {
  return normalize(
    [
      productName(product, lang),
      productDescription(product, lang),
      product.sku,
      ...product.sizes,
      ...product.colors.map((color) => colorLabel(color, lang)),
      ...product.finishes.map((finish) => finishLabel(finish, lang)),
    ].join(' ')
  );
}

export function matches(product: Product, filters: Filters, lang: Lang): boolean {
  if (filters.cat && product.cat !== filters.cat) return false;
  if (filters.size && !product.sizes.includes(filters.size)) return false;
  if (filters.color && !product.colors.includes(filters.color)) return false;
  if (filters.finish && !product.finishes.includes(filters.finish)) return false;
  if (!filters.q) return true;

  const text = haystack(product, lang);
  return normalize(filters.q)
    .split(/\s+/)
    .every((term) => text.includes(term));
}

const COMPARATORS: Record<Sort, (a: Product, b: Product) => number> = {
  relevancia: (a, b) => a.sort_order - b.sort_order,
  'preco-asc': (a, b) => a.price - b.price,
  'preco-desc': (a, b) => b.price - a.price,
  avaliacao: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
};

export function applyFilters(products: Product[], filters: Filters, lang: Lang): Product[] {
  return products.filter((p) => matches(p, filters, lang)).sort(COMPARATORS[filters.sort]);
}

// Opções derivam do catálogo vivo, nunca de uma lista fixa: tamanho que ninguém mais
// vende não pode continuar aparecendo como filtro e devolver zero resultado.
export function optionsFrom(products: Product[], key: 'sizes' | 'colors' | 'finishes'): string[] {
  const seen = new Set<string>();
  for (const product of products) for (const value of product[key]) seen.add(value);
  return [...seen];
}

export function relatedTo(products: Product[], product: Product, limit = 4): Product[] {
  const sameCat = products.filter((p) => p.id !== product.id && p.cat === product.cat);
  const rest = products.filter((p) => p.id !== product.id && p.cat !== product.cat);
  return [...sameCat, ...rest].slice(0, limit);
}
