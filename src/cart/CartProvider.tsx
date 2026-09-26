import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toAnalyticsItem, track } from '../lib/analytics';
import { addItem, cartCount, lineQty, removeItem, sanitizeCart, setQty as setItemQty } from '../lib/cart';
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

  // Medição fora do updater do setState: o StrictMode chama o updater duas vezes e cada evento
  // sairia em dobro. A ref dá o carrinho atual sem recriar os callbacks a cada mudança.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const productsRef = useRef(products);
  productsRef.current = products;

  const trackDelta = useCallback((item: CartItem, delta: number) => {
    const product = productsRef.current.find((p) => p.id === item.id);
    if (!product || delta === 0) return;
    const line = toAnalyticsItem(product, { ...item, qty: Math.abs(delta) });
    track(delta > 0 ? 'add_to_cart' : 'remove_from_cart', {
      currency: 'BRL',
      value: line.price * line.quantity,
      items: [line],
    });
  }, []);

  // Mede a diferença real, não o pedido: somar além do teto de 99 não é mais uma peça.
  const change = useCallback(
    (item: CartItem, next: (cart: CartItem[]) => CartItem[]) => {
      const current = itemsRef.current;
      const updated = next(current);
      // Dois cliques antes do próximo render leriam o mesmo carrinho e mediriam errado.
      itemsRef.current = updated;
      trackDelta(item, lineQty(updated, item) - lineQty(current, item));
      setItems(next);
    },
    [trackDelta]
  );

  const add = useCallback(
    (item: CartItem) => change(item, (cart) => addItem(cart, item)),
    [change]
  );
  const remove = useCallback(
    (item: CartItem) => change(item, (cart) => removeItem(cart, item)),
    [change]
  );
  const setQty = useCallback(
    (item: CartItem, qty: number) => change(item, (cart) => setItemQty(cart, item, qty)),
    [change]
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
