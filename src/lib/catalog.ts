import { supabase } from './supabase';

export type { Lang } from './i18n';
export type Category = 'medalhoes' | 'lapides' | 'porcelanato' | 'acessorios';
export type Unit = 'un' | 'm2';

export interface Product {
  id: string;
  slug: string;
  sku: string;
  cat: Category;
  name_pt: string;
  name_en: string;
  desc_pt: string;
  desc_en: string;
  badge_pt: string | null;
  badge_en: string | null;
  price: number;
  unit: Unit;
  img: string;
  sizes: string[];
  colors: string[];
  finishes: string[];
  rating: number;
  reviews: number;
  stock: number;
  sort_order: number;
  ml_item_id: string | null;
  ml_permalink: string | null;
}

export interface CartItem {
  id: string;
  qty: number;
  size?: string;
  color?: string;
  finish?: string;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('sort_order');
  if (error) throw new Error(error.message);
  // `price` é numeric no Postgres e chega como string em algumas rotas do PostgREST.
  // String em cálculo de carrinho vira "249249" em vez de 498 sem erro nenhum.
  return (data ?? []).map((row) => ({
    ...(row as Product),
    price: Number(row.price),
    rating: Number(row.rating),
  }));
}

export interface OrderInput {
  customer: string;
  phone: string;
  note?: string;
  items: CartItem[];
}

/** Pedido barrado pelo freio anti-enxurrada. Insistir agora falha de novo; a tela precisa saber. */
export class OrderRateLimitError extends Error {}

// O id sai daqui em vez de vir do banco porque `orders` não tem policy de SELECT: um
// `insert().select()` voltaria vazio. Gerando o uuid no cliente, a tela de confirmação
// mostra o número do pedido sem que a loja precise abrir leitura de pedidos ao anônimo.
export async function createOrder(order: OrderInput): Promise<string> {
  const id = crypto.randomUUID();
  // O total NÃO vai no corpo: um trigger recalcula do preço vigente. Mandar daqui só
  // criaria a ilusão de que o número escolhido pelo navegador vale alguma coisa.
  const { error } = await supabase.from('orders').insert({ ...order, id });
  if (error) {
    if (error.code === 'PT429') throw new OrderRateLimitError(error.message);
    throw new Error(error.message);
  }
  return id;
}

export function orderReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
