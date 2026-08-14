import type { CartItem, Product } from './catalog';
import type { Lang } from './i18n';
import { dictionaries } from './i18n';
import { colorLabel, finishLabel, productName } from './labels';
import { money } from './format';

// Teto por linha. O banco limita o número de linhas do pedido, não a quantidade dentro
// de cada uma: sem isto um localStorage editado à mão vira pedido de dez milhões.
export const MAX_QTY = 99;

export const FREE_SHIPPING_FROM = 350;
export const FLAT_SHIPPING = 39.9;

function sameVariant(a: CartItem, b: CartItem): boolean {
  return a.id === b.id && a.size === b.size && a.color === b.color && a.finish === b.finish;
}

function clampQty(qty: number): number {
  return Math.min(Math.max(Math.trunc(qty), 1), MAX_QTY);
}

export function addItem(cart: CartItem[], itemToAdd: CartItem): CartItem[] {
  const index = cart.findIndex((item) => sameVariant(item, itemToAdd));
  if (index >= 0) {
    const updated = [...cart];
    updated[index] = { ...updated[index], qty: clampQty(updated[index].qty + itemToAdd.qty) };
    return updated;
  }
  return [...cart, { ...itemToAdd, qty: clampQty(itemToAdd.qty) }];
}

export function removeItem(cart: CartItem[], itemToRemove: CartItem): CartItem[] {
  return cart.filter((item) => !sameVariant(item, itemToRemove));
}

export function setQty(cart: CartItem[], itemToUpdate: CartItem, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(cart, itemToUpdate);

  const index = cart.findIndex((item) => sameVariant(item, itemToUpdate));
  if (index >= 0) {
    const updated = [...cart];
    updated[index] = { ...updated[index], qty: clampQty(qty) };
    return updated;
  }
  return [...cart, { ...itemToUpdate, qty: clampQty(qty) }];
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotal(products: Product[], items: CartItem[]): number {
  return items.reduce((total, item) => {
    const product = products.find((p) => p.id === item.id);
    return product ? total + product.price * item.qty : total;
  }, 0);
}

export function shippingFor(subtotal: number): number {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : FLAT_SHIPPING;
}

// Carrinho vem do localStorage, ou seja, de uma fonte que o visitante controla. Tudo
// que não casar com o catálogo vivo é descartado em silêncio: peça que saiu do ar,
// opção que não existe mais, quantidade absurda ou objeto de formato inventado.
export function sanitizeCart(raw: unknown, products: Product[]): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map(products.map((p) => [p.id, p]));

  const clean: CartItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== 'string') continue;

    const product = byId.get(item.id);
    if (!product) continue;

    if (typeof item.qty !== 'number' || !Number.isFinite(item.qty) || item.qty < 1) continue;

    const pick = (value: unknown, allowed: string[]) =>
      typeof value === 'string' && allowed.includes(value) ? value : undefined;

    const size = pick(item.size, product.sizes);
    const color = pick(item.color, product.colors);
    const finish = pick(item.finish, product.finishes);

    clean.push({
      id: item.id,
      qty: clampQty(item.qty),
      ...(size ? { size } : {}),
      ...(color ? { color } : {}),
      ...(finish ? { finish } : {}),
    });
  }

  // Reagrupa: duas linhas que viraram a mesma variante depois do descarte de opção
  // inválida precisam somar, não aparecer duplicadas.
  return clean.reduce<CartItem[]>((acc, item) => addItem(acc, item), []);
}

export interface WhatsappOptions {
  lang: Lang;
  customer: string;
  reference?: string;
}

export function whatsappMessage(
  products: Product[],
  items: CartItem[],
  { lang, customer, reference }: WhatsappOptions
): string {
  const t = dictionaries[lang];
  const lines = [`${t.orderMsgHello} ${customer},`, '', `${t.orderMsgOrder}:`];

  for (const item of items) {
    const product = products.find((p) => p.id === item.id);
    if (!product) continue;

    const details = [
      item.size,
      item.color ? colorLabel(item.color, lang) : undefined,
      item.finish ? finishLabel(item.finish, lang) : undefined,
    ].filter(Boolean);

    const suffix = details.length ? ` [${details.join(' · ')}]` : '';
    lines.push(`- ${productName(product, lang)} (${item.qty}x)${suffix}`);
  }

  lines.push('', `${t.orderMsgTotal}: ${money(cartTotal(products, items))}`);
  if (reference) lines.push(`${t.orderMsgRef}: ${reference}`);

  return lines.join('\n');
}

// Número inválido no .env não pode virar link wa.me apontando para contato inexistente:
// melhor não oferecer o atalho do que oferecer um quebrado.
export function whatsappLink(phone: string | undefined, message: string): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
