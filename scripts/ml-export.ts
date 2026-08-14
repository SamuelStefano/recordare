import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Product } from '../src/lib/catalog';
import { buildKit, toCsv, toMarkdown } from '../src/lib/mercadolivre';

// O script fala PostgREST direto em vez de reusar src/lib/supabase.ts: aquele módulo lê
// import.meta.env, que só existe no bundle do navegador.
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// O padrão aponta para onde a loja realmente está: link morto num anúncio custa a venda.
const storeOrigin = process.env.STORE_ORIGIN ?? 'https://samuelstefano.github.io/recordare';
const outDir = join(process.cwd(), 'out', 'mercadolivre');

if (!url || !key) {
  console.error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.');
  process.exit(1);
}

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(
    `${url}/rest/v1/products?active=eq.true&order=sort_order&select=*`,
    { headers: { apikey: key!, Authorization: `Bearer ${key!}`, 'Accept-Profile': 'recordare' } }
  );
  if (!response.ok) {
    throw new Error(`PostgREST ${response.status}: ${await response.text()}`);
  }
  const rows = (await response.json()) as Product[];
  return rows.map((row) => ({ ...row, price: Number(row.price) }));
}

const products = await fetchProducts();
const kit = buildKit(products, storeOrigin);

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'anuncios.csv'), toCsv(kit.listings), 'utf8');
await writeFile(join(outDir, 'anuncios.md'), toMarkdown(kit), 'utf8');

console.log(`${kit.listings.length} anúncios gerados em out/mercadolivre/`);

if (kit.warnings.length > 0) {
  console.warn(`\n${kit.warnings.length} aviso(s):`);
  for (const warning of kit.warnings) {
    console.warn(`  ${warning.sku} · ${warning.field}: ${warning.message}`);
  }
}

if (kit.issues.length > 0) {
  console.error(`\n${kit.issues.length} pendência(s) antes de publicar:`);
  for (const issue of kit.issues) console.error(`  ${issue.sku} · ${issue.field}: ${issue.message}`);
  // Sai com erro para o CI reprovar catálogo que ainda não pode virar anúncio.
  process.exit(1);
}
