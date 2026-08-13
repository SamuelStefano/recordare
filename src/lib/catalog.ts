import { supabase } from './supabase';

export type Lang = 'pt' | 'en';
export type Category = 'medalhoes' | 'lapides' | 'porcelanato' | 'acessorios';

export interface Product {
  id: string;
  cat: Category;
  name_pt: string;
  name_en: string;
  desc_pt: string;
  desc_en: string;
  badge_pt: string | null;
  badge_en: string | null;
  price: number;
  unit: 'un' | 'm2';
  img: string;
  sizes: string[];
  colors: string[];
  finishes: string[];
  rating: number;
  reviews: number;
}

export interface CartItem {
  id: string;
  qty: number;
  size?: string;
  color?: string;
  finish?: string;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('id');
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export interface OrderInput {
  customer: string;
  phone: string;
  note?: string;
  items: CartItem[];
}

// O total não vai no corpo: um trigger recalcula a partir do preço vigente. Mandar
// daqui só criaria a ilusão de que o número do navegador vale alguma coisa.
export async function createOrder(order: OrderInput): Promise<void> {
  const { error } = await supabase.from('orders').insert(order);
  if (error) throw new Error(error.message);
}
