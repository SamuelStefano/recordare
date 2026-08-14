import type { Product } from '../lib/catalog';

let seq = 0;

export function makeProduct(overrides: Partial<Product> = {}): Product {
  seq += 1;
  const id = overrides.id ?? `p${seq}`;
  return {
    id,
    slug: `${id}-peca`,
    sku: `REC-${id.toUpperCase()}`,
    cat: 'medalhoes',
    name_pt: 'Medalhão Oval Clássico',
    name_en: 'Classic Oval Medallion',
    desc_pt: 'Fotoporcelana oval de alta durabilidade.',
    desc_en: 'High-durability oval photo porcelain.',
    badge_pt: null,
    badge_en: null,
    price: 100,
    unit: 'un',
    img: 'https://example.test/p.jpg',
    sizes: ['13x18', '18x24'],
    colors: ['branco', 'marfim'],
    finishes: ['fosco', 'brilhante'],
    rating: 4.9,
    reviews: 128,
    stock: 10,
    sort_order: seq,
    ml_item_id: null,
    ml_permalink: null,
    ...overrides,
  };
}
