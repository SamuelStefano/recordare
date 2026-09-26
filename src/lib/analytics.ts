import type { CartItem, Product } from './catalog';
import { cartTotal } from './cart';

// Eventos no formato de e-commerce do GA4, empurrados no `window.dataLayer`. É o contrato que o
// Google Tag Manager, o GA4 e a maioria dos conectores (Meta, TikTok, Clarity via GTM) já sabem
// ler, então plugar uma ferramenta nova é configuração no painel dela, não código na loja.
//
// A loja não carrega script de terceiro nenhum: o CSP só aceita script próprio. Enquanto ninguém
// liberar um host no CSP, o dataLayer enche e ninguém lê — de propósito, custo zero.

export type AnalyticsEventName =
  | 'view_item_list'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'generate_lead'
  | 'contact';

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

export interface AnalyticsPayload {
  currency?: 'BRL';
  value?: number;
  items?: AnalyticsItem[];
  item_list_id?: string;
  transaction_id?: string;
  method?: string;
}

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  ecommerce: AnalyticsPayload;
}

/** Nome do evento de DOM, para quem quiser ouvir sem depender do dataLayer. */
export const TRACK_EVENT = 'recordare:track';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function toAnalyticsItem(product: Product, item: Pick<CartItem, 'qty' | 'size' | 'color' | 'finish'>): AnalyticsItem {
  const variant = [item.size, item.color, item.finish].filter(Boolean).join(' / ');
  return {
    // SKU em vez do uuid: é o id que aparece no Mercado Livre e na planilha, então o relatório
    // de uma ferramenta bate com o do outro canal sem tabela de tradução.
    item_id: product.sku,
    // Nome sempre em português: o mesmo produto em dois idiomas viraria duas linhas no relatório.
    item_name: product.name_pt,
    item_category: product.cat,
    ...(variant && { item_variant: variant }),
    price: product.price,
    quantity: item.qty,
  };
}

export function cartItems(products: Product[], items: CartItem[]): AnalyticsItem[] {
  return items.flatMap((item) => {
    const product = products.find((p) => p.id === item.id);
    return product ? [toAnalyticsItem(product, item)] : [];
  });
}

export function cartPayload(products: Product[], items: CartItem[]): AnalyticsPayload {
  return { currency: 'BRL', value: cartTotal(products, items), items: cartItems(products, items) };
}

// Nome e telefone do cliente nunca entram aqui: o dataLayer é lido por qualquer tag que alguém
// plugar depois, e mandar dado pessoal para terceiro sem consentimento é problema de LGPD.
export function track(event: AnalyticsEventName, ecommerce: AnalyticsPayload = {}): void {
  if (typeof window === 'undefined') return;
  const entry: AnalyticsEvent = { event, ecommerce };
  try {
    window.dataLayer ??= [];
    // O GA4 mescla `ecommerce` entre eventos: sem zerar antes, o add_to_cart herda os itens do
    // view_item_list anterior e o relatório infla.
    window.dataLayer.push({ ecommerce: null }, entry);
    window.dispatchEvent(new CustomEvent(TRACK_EVENT, { detail: entry }));
  } catch {
    // Medição nunca pode derrubar uma venda.
  }
}
