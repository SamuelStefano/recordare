import type { Product } from './catalog';
import { stockPhotoHost } from './image';
import { categoryLabel, productDescription, productName } from './labels';

// Feeds de catálogo para Google Merchant Center (vitrine grátis e Shopping) e para o catálogo da
// Meta (Instagram Shopping, anúncio de catálogo no WhatsApp). Os dois baixam o arquivo por URL
// numa rotina diária, então o feed é gerado no deploy a partir do catálogo vivo: preço e estoque
// mudam no Supabase e chegam nos dois canais no próximo deploy, sem planilha no meio.

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  availability: 'in stock' | 'out of stock';
  price: string;
  productType: string;
  unit: Product['unit'];
}

export interface FeedExclusion {
  sku: string;
  reason: string;
}

export interface Feed {
  items: FeedItem[];
  excluded: FeedExclusion[];
}

export const BRAND = 'Recordare';

export function buildFeed(products: Product[], storeOrigin: string): Feed {
  const origin = storeOrigin.replace(/\/$/, '');
  const items: FeedItem[] = [];
  const excluded: FeedExclusion[] = [];

  for (const product of products) {
    // Fica de fora em vez de ir com aviso: Google e Meta publicam a foto que baixam, e a vitrine
    // mostraria a peça com o retrato de outra pessoa. Quando a foto real entrar, a peça aparece
    // no feed sozinha no próximo deploy.
    const host = stockPhotoHost(product.img);
    if (host) {
      excluded.push({ sku: product.sku, reason: `foto de banco de imagem (${host})` });
      continue;
    }

    items.push({
      id: product.sku,
      title: productName(product, 'pt'),
      description: productDescription(product, 'pt'),
      // Barra final: a loja serve /peca/<slug>/ e o Merchant Center reprova link que redireciona.
      link: `${origin}/peca/${product.slug}/`,
      imageLink: product.img,
      availability: product.stock > 0 ? 'in stock' : 'out of stock',
      price: `${product.price.toFixed(2)} BRL`,
      productType: categoryLabel(product.cat, 'pt'),
      unit: product.unit,
    });
  }

  return { items, excluded };
}

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function toGoogleXml(feed: Feed, storeOrigin: string): string {
  const tag = (name: string, value: string) => `      <${name}>${xml(value)}</${name}>`;
  const entries = feed.items.map((item) =>
    [
      '    <item>',
      tag('g:id', item.id),
      tag('title', item.title),
      tag('description', item.description),
      tag('link', item.link),
      tag('g:image_link', item.imageLink),
      tag('g:availability', item.availability.replaceAll(' ', '_')),
      tag('g:price', item.price),
      tag('g:condition', 'new'),
      tag('g:brand', BRAND),
      // Peça sob encomenda não tem GTIN nem código de fabricante. Sem este campo o Merchant Center
      // cobra um identificador que não existe e limita a exibição.
      tag('g:identifier_exists', 'no'),
      tag('g:product_type', item.productType),
      // Porcelanato é vendido por m²: o preço já é o de uma unidade vendida, e o preço unitário
      // deixa o Google mostrar "R$/m²" em vez de parecer uma peça barata demais.
      ...(item.unit === 'm2'
        ? [tag('g:unit_pricing_measure', '1sqm'), tag('g:unit_pricing_base_measure', '1sqm')]
        : []),
      '    </item>',
    ].join('\n')
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${BRAND}</title>`,
    `    <link>${xml(`${storeOrigin.replace(/\/$/, '')}/`)}</link>`,
    '    <description>Catálogo da loja Recordare</description>',
    ...entries,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export const META_COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'product_type',
] as const;

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toMetaCsv(feed: Feed): string {
  const rows = feed.items.map((item) =>
    [
      item.id,
      item.title,
      item.description,
      item.availability,
      'new',
      item.price,
      item.link,
      item.imageLink,
      BRAND,
      item.productType,
    ]
      .map(csvCell)
      .join(',')
  );
  return [META_COLUMNS.join(','), ...rows, ''].join('\n');
}
