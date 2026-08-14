import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Product } from '../src/lib/catalog';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const origin = (process.env.STORE_ORIGIN ?? 'https://recordare.vercel.app').replace(/\/$/, '');
const publicDir = join(process.cwd(), 'public');

if (!url || !key) {
  console.error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.');
  process.exit(1);
}

const response = await fetch(`${url}/rest/v1/products?active=eq.true&order=sort_order&select=slug`, {
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'recordare' },
});
if (!response.ok) {
  throw new Error(`PostgREST ${response.status}: ${await response.text()}`);
}
const products = (await response.json()) as Pick<Product, 'slug'>[];

const today = new Date().toISOString().slice(0, 10);
// Barra final obrigatória: precisa casar com o canonical das páginas pré-renderizadas.
const entry = (path: string, priority: string) =>
  `  <url>\n    <loc>${origin}${path === '/' ? '/' : `${path}/`}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  entry('/', '1.0'),
  entry('/catalogo', '0.9'),
  ...products.map((product) => entry(`/peca/${product.slug}`, '0.8')),
  '</urlset>',
  '',
].join('\n');

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /carrinho',
  'Disallow: /pedido/',
  '',
  `Sitemap: ${origin}/sitemap.xml`,
  '',
].join('\n');

await mkdir(publicDir, { recursive: true });
await writeFile(join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(join(publicDir, 'robots.txt'), robots, 'utf8');

console.log(`sitemap.xml com ${products.length + 2} URLs e robots.txt gerados em public/`);
