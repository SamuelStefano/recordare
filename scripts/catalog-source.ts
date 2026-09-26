import type { Product } from '../src/lib/catalog';

// Os scripts falam PostgREST direto em vez de reusar src/lib/supabase.ts: aquele módulo lê
// import.meta.env, que só existe no bundle do navegador.
export async function fetchActiveProducts(): Promise<Product[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.');
    process.exit(1);
  }

  const response = await fetch(`${url}/rest/v1/products?active=eq.true&order=sort_order&select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'recordare' },
  });
  if (!response.ok) throw new Error(`PostgREST ${response.status}: ${await response.text()}`);
  // `price` é numeric e chega como string: somado, "249" + "249" vira "249249".
  return ((await response.json()) as Product[]).map((row) => ({ ...row, price: Number(row.price) }));
}

// O padrão aponta para onde a loja realmente está: link morto num anúncio ou feed custa a venda.
export function storeOrigin(): string {
  return (process.env.STORE_ORIGIN ?? 'https://samuelstefano.github.io/recordare').replace(/\/$/, '');
}
