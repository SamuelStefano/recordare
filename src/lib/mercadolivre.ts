import type { Product } from './catalog';
import { colorLabel, finishLabel } from './labels';

// Regras do Mercado Livre que quebram anúncio na publicação, não na revisão:
// título de até 60 caracteres, sem palavra promocional, sem emoji, sem link, e a
// descrição sem contato externo. Melhor o gerador recusar do que a conta tomar
// infração depois de 40 anúncios no ar.
export const MAX_TITLE = 60;
export const MAX_DESCRIPTION = 50_000;

const BANNED_TITLE_WORDS = [
  'promocao',
  'promoção',
  'oferta',
  'frete gratis',
  'frete grátis',
  'barato',
  'desconto',
  'imperdivel',
  'imperdível',
  'liquidacao',
  'liquidação',
  'melhor preco',
  'melhor preço',
  '12x',
  'parcelado',
];

const CONTACT_PATTERNS = [
  /https?:\/\//i,
  /www\./i,
  /\bwhatsapp\b/i,
  /\bwpp\b/i,
  /[\w.+-]+@[\w-]+\.[\w.]+/,
  /\(?\d{2}\)?\s?9?\d{4}[- ]?\d{4}/,
];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\u{FE0F}/u;

export interface Listing {
  sku: string;
  title: string;
  price: number;
  unit: 'un' | 'm2';
  stock: number;
  category: string;
  description: string;
  attributes: Record<string, string>;
  imageUrl: string;
  storeUrl: string;
}

export interface ListingIssue {
  sku: string;
  field: 'title' | 'description' | 'stock' | 'image';
  message: string;
}

export interface ListingKit {
  listings: Listing[];
  issues: ListingIssue[];
  warnings: ListingIssue[];
}

// Padrão exigido pelo ML: Produto + Marca + Modelo + Especificação, sem promo.
export function buildTitle(product: Product): string {
  const spec = product.sizes[0] ? ` ${product.sizes[0]}` : '';
  const full = `${product.name_pt} Recordare${spec}`;
  if (full.length <= MAX_TITLE) return full;

  const withoutSpec = `${product.name_pt} Recordare`;
  if (withoutSpec.length <= MAX_TITLE) return withoutSpec;
  return product.name_pt.slice(0, MAX_TITLE).trimEnd();
}

export function buildDescription(product: Product): string {
  const lines = [
    product.desc_pt,
    '',
    `SKU: ${product.sku}`,
    `Unidade de venda: ${product.unit === 'm2' ? 'metro quadrado' : 'peça'}`,
  ];

  if (product.sizes.length) lines.push(`Tamanhos: ${product.sizes.join(', ')}`);
  if (product.colors.length) {
    lines.push(`Cores: ${product.colors.map((c) => colorLabel(c, 'pt')).join(', ')}`);
  }
  if (product.finishes.length) {
    lines.push(`Acabamentos: ${product.finishes.map((f) => finishLabel(f, 'pt')).join(', ')}`);
  }

  lines.push(
    '',
    'Produção sob encomenda com impressão vitrificada em forno a 820°C.',
    'Personalização de foto, nome e datas confirmada pelo chat do Mercado Livre.'
  );

  return lines.join('\n');
}

export function buildAttributes(product: Product): Record<string, string> {
  return {
    MARCA: 'Recordare',
    MODELO: product.sku,
    ...(product.sizes[0] ? { TAMANHO: product.sizes[0] } : {}),
    ...(product.colors[0] ? { COR: colorLabel(product.colors[0], 'pt') } : {}),
    ...(product.finishes[0] ? { ACABAMENTO: finishLabel(product.finishes[0], 'pt') } : {}),
  };
}

function checkListing(listing: Listing, product: Product): ListingIssue[] {
  const issues: ListingIssue[] = [];
  const title = listing.title.toLowerCase();

  if (listing.title.length > MAX_TITLE) {
    issues.push({ sku: listing.sku, field: 'title', message: `Título acima de ${MAX_TITLE}` });
  }
  for (const word of BANNED_TITLE_WORDS) {
    if (title.includes(word)) {
      issues.push({ sku: listing.sku, field: 'title', message: `Palavra proibida: ${word}` });
    }
  }
  if (EMOJI.test(listing.title)) {
    issues.push({ sku: listing.sku, field: 'title', message: 'Título com emoji' });
  }
  for (const pattern of CONTACT_PATTERNS) {
    if (pattern.test(listing.description)) {
      issues.push({
        sku: listing.sku,
        field: 'description',
        message: 'Descrição com contato ou link externo',
      });
      break;
    }
  }
  if (listing.description.length > MAX_DESCRIPTION) {
    issues.push({ sku: listing.sku, field: 'description', message: 'Descrição longa demais' });
  }
  if (listing.stock <= 0) {
    issues.push({ sku: listing.sku, field: 'stock', message: 'Sem estoque para anunciar' });
  }
  if (!/^https:\/\//.test(product.img)) {
    issues.push({ sku: listing.sku, field: 'image', message: 'Imagem precisa ser https' });
  }

  return issues;
}

export function buildListing(product: Product, storeOrigin: string): Listing {
  return {
    sku: product.sku,
    title: buildTitle(product),
    price: product.price,
    unit: product.unit,
    stock: product.stock,
    category: product.cat,
    description: buildDescription(product),
    attributes: buildAttributes(product),
    imageUrl: product.img,
    // Barra final: a loja serve /peca/<slug>/ e sem ela responde redirect. Anúncio não leva redirect.
    storeUrl: `${storeOrigin.replace(/\/$/, '')}/peca/${product.slug}/`,
  };
}

// Host de banco de imagem: a foto não é da peça, é retrato de terceiro que veio junto na semeadura
// do catálogo. Publicar assim não é risco técnico, é anunciar produto com a foto de outra pessoa.
const PLACEHOLDER_HOSTS = /(^|\.)wikimedia\.org$|(^|\.)wikipedia\.org$|(^|\.)unsplash\.com$/;

// O Mercado Livre baixa a foto na hora de criar o anúncio, então tudo que estiver errado na imagem
// vira anúncio publicado errado. Avisa em vez de reprovar: bloquear pararia o kit inteiro, e quem
// troca foto de catálogo é o dono da loja, não o build.
function checkImageHost(listing: Listing, storeOrigin: string): ListingIssue[] {
  if (listing.imageUrl.startsWith(storeOrigin.replace(/\/$/, ''))) return [];
  const host = new URL(listing.imageUrl).host;
  return [
    {
      sku: listing.sku,
      field: 'image',
      message: PLACEHOLDER_HOSTS.test(host)
        ? `NÃO PUBLIQUE: a foto é de banco de imagem (${host}), não é a peça — troque pela foto real antes de anunciar`
        : `Foto hospedada fora da loja (${host}) — se o host responder 429 o anúncio sobe sem imagem`,
    },
  ];
}

export function buildKit(products: Product[], storeOrigin: string): ListingKit {
  const listings: Listing[] = [];
  const issues: ListingIssue[] = [];
  const warnings: ListingIssue[] = [];

  for (const product of products) {
    const listing = buildListing(product, storeOrigin);
    listings.push(listing);
    issues.push(...checkListing(listing, product));
    if (/^https:\/\//.test(listing.imageUrl)) {
      warnings.push(...checkImageHost(listing, storeOrigin));
    }
  }

  return { listings, issues, warnings };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const CSV_COLUMNS = [
  'sku',
  'titulo',
  'preco',
  'unidade',
  'estoque',
  'categoria',
  'marca',
  'modelo',
  'tamanho',
  'cor',
  'acabamento',
  'imagem',
  'link_loja',
  'descricao',
] as const;

export function toCsv(listings: Listing[]): string {
  const rows = listings.map((listing) =>
    [
      listing.sku,
      listing.title,
      listing.price.toFixed(2),
      listing.unit,
      listing.stock,
      listing.category,
      listing.attributes.MARCA ?? '',
      listing.attributes.MODELO ?? '',
      listing.attributes.TAMANHO ?? '',
      listing.attributes.COR ?? '',
      listing.attributes.ACABAMENTO ?? '',
      listing.imageUrl,
      listing.storeUrl,
      listing.description,
    ]
      .map(csvCell)
      .join(',')
  );

  return [CSV_COLUMNS.join(','), ...rows].join('\n');
}

export function toMarkdown(kit: ListingKit): string {
  const lines = ['# Anúncios Recordare — Mercado Livre', ''];

  // O bloqueio real deste kit não é técnico: um anúncio com foto de banco de imagem sobe e vende
  // errado. Vai no topo porque é a primeira coisa que precisa ser lida, antes dos anúncios.
  const impeditivos = kit.warnings.filter((w) => w.message.startsWith('NÃO PUBLIQUE'));
  if (impeditivos.length) {
    lines.push(
      '> **Antes de publicar:** ' +
        `${impeditivos.length} de ${kit.listings.length} anúncios ainda usam foto de banco de ` +
        'imagem. Troque pela foto real da peça — publicar assim anuncia a peça com a imagem de ' +
        'outra pessoa.',
      ''
    );
  }

  if (kit.warnings.length) {
    lines.push('## Avisos', '');
    for (const warning of kit.warnings) {
      lines.push(`- \`${warning.sku}\` · **${warning.field}** — ${warning.message}`);
    }
    lines.push('');
  }

  if (kit.issues.length) {
    lines.push('## Pendências antes de publicar', '');
    for (const issue of kit.issues) {
      lines.push(`- \`${issue.sku}\` · **${issue.field}** — ${issue.message}`);
    }
    lines.push('');
  }

  for (const listing of kit.listings) {
    lines.push(
      `## ${listing.title}`,
      '',
      `- **SKU:** ${listing.sku}`,
      `- **Preço:** R$ ${listing.price.toFixed(2)} ${listing.unit === 'm2' ? 'por m²' : 'por peça'}`,
      `- **Estoque:** ${listing.stock}`,
      `- **Atributos:** ${Object.entries(listing.attributes)
        .map(([key, value]) => `${key}=${value}`)
        .join(' · ')}`,
      `- **Imagem:** ${listing.imageUrl}`,
      `- **Página na loja:** ${listing.storeUrl}`,
      '',
      '```',
      listing.description,
      '```',
      ''
    );
  }

  return lines.join('\n');
}
