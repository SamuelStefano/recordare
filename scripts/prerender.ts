import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Product } from '../src/lib/catalog';
import { dictionaries } from '../src/lib/i18n';
import { productDescription, productName } from '../src/lib/labels';

// GitHub Pages não reescreve rota de SPA: /peca/<slug> cairia no 404.html e responderia 404 para
// o Google. Escrever um index.html por rota resolve o status e ainda entrega o <head> certo sem
// depender de JavaScript — o corpo continua hidratando no cliente.
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const origin = (process.env.STORE_ORIGIN ?? 'https://recordare.vercel.app').replace(/\/$/, '');
const dist = join(process.cwd(), 'dist');
const pt = dictionaries.pt;

if (!url || !key) {
  console.error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.');
  process.exit(1);
}

const response = await fetch(`${url}/rest/v1/products?active=eq.true&order=sort_order&select=*`, {
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'recordare' },
});
if (!response.ok) throw new Error(`PostgREST ${response.status}: ${await response.text()}`);
const products = ((await response.json()) as Product[]).map((row) => ({
  ...row,
  price: Number(row.price),
}));

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

interface Page {
  path: string;
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const pages: Page[] = [
  {
    path: '/',
    title: `Recordare · ${pt.heroTitle}`,
    description: pt.heroSub,
  },
  {
    path: '/catalogo',
    title: `${pt.catalogTitle} · Recordare`,
    description: pt.catsSub,
  },
  {
    path: '/carrinho',
    title: `${pt.cartTitle} · Recordare`,
    description: pt.cartEmpty,
    noindex: true,
  },
  ...products.map((product) => ({
    path: `/peca/${product.slug}`,
    title: `${productName(product, 'pt')} · Recordare`,
    description: productDescription(product, 'pt'),
    image: product.img,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName(product, 'pt'),
      description: productDescription(product, 'pt'),
      image: product.img,
      sku: product.sku,
      brand: { '@type': 'Brand', name: 'Recordare' },
      offers: {
        '@type': 'Offer',
        price: product.price.toFixed(2),
        priceCurrency: 'BRL',
        availability:
          product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${origin}/peca/${product.slug}/`,
      },
    },
  })),
];

const template = await readFile(join(dist, 'index.html'), 'utf8');

function render(page: Page) {
  const canonical = `${origin}${page.path === '/' ? '/' : `${page.path}/`}`;
  const head = [
    `<meta name="description" content="${escape(page.description)}" />`,
    `<meta property="og:title" content="${escape(page.title)}" />`,
    `<meta property="og:description" content="${escape(page.description)}" />`,
    `<meta property="og:url" content="${escape(canonical)}" />`,
    page.image ? `<meta property="og:image" content="${escape(page.image)}" />` : '',
    `<meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow'}" />`,
    `<link rel="canonical" href="${escape(canonical)}" />`,
    page.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  return template
    .replace(/<title>.*?<\/title>/s, `<title>${escape(page.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/<meta\s+property="og:(title|description)"[\s\S]*?\/>/g, '')
    .replace('</head>', `  ${head}\n  </head>`);
}

for (const page of pages) {
  const dir = page.path === '/' ? dist : join(dist, page.path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), render(page), 'utf8');
}

console.log(`${pages.length} rotas pré-renderizadas em dist/`);
