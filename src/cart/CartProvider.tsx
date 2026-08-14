import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addItem, cartCount, removeItem, sanitizeCart, setQty as setItemQty } from '../lib/cart';
import type { CartItem } from '../lib/catalog';
import { useCatalog } from '../catalog/catalog-context';
import { CartContext, type CartValue } from './cart-context';

export const CART_STORAGE_KEY = 'recordare.cart.v1';

function readStored(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, status } = useCatalog();
  const [items, setItems] = useState<CartItem[]>(readStored);
  const [dropped, setDropped] = useState(false);

  // O carrinho é lido antes do catálogo chegar, senão a sacola pisca vazia no primeiro
  // frame. A checagem contra o catálogo vivo acontece assim que ele carrega — e só aí
  // dá para saber se uma peça saiu do ar.
  useEffect(() => {
    if (status !== 'ready') return;
    const clean = sanitizeCart(items, products);
    if (JSON.stringify(clean) === JSON.stringify(items)) return;
    if (cartCount(clean) !== cartCount(items)) setDropped(true);
    setItems(clean);
  }, [status, products, items]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage cheio ou bloqueado: o carrinho segue em memória nesta aba.
    }
  }, [items]);

  const add = useCallback((item: CartItem) => setItems((current) => addItem(current, item)), []);
  const remove = useCallback(
    (item: CartItem) => setItems((current) => removeItem(current, item)),
    []
  );
  const setQty = useCallback(
    (item: CartItem, qty: number) => setItems((current) => setItemQty(current, item, qty)),
    []
  );
  const clear = useCallback(() => setItems([]), []);
  const dismissDropped = useCallback(() => setDropped(false), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: cartCount(items),
      add,
      remove,
      setQty,
      clear,
      dropped,
      dismissDropped,
    }),
    [items, add, remove, setQty, clear, dropped, dismissDropped]
  );

  return <CartContext value={value}>{children}</CartContext>;
}
