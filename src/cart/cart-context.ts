import { createContext, use } from 'react';
import type { CartItem } from '../lib/catalog';

export interface CartValue {
  items: CartItem[];
  count: number;
  add: (item: CartItem) => void;
  remove: (item: CartItem) => void;
  setQty: (item: CartItem, qty: number) => void;
  clear: () => void;
  /** Alguma linha foi descartada por não existir mais no catálogo. */
  dropped: boolean;
  dismissDropped: () => void;
}

export const CartContext = createContext<CartValue | null>(null);

export function useCart(): CartValue {
  const value = use(CartContext);
  if (!value) throw new Error('useCart() exige <CartProvider> acima na árvore.');
  return value;
}
