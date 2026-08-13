import type { Product, CartItem } from './catalog';

export function addItem(cart: CartItem[], itemToAdd: CartItem): CartItem[] {
  const existingIndex = cart.findIndex(
    (item) =>
      item.id === itemToAdd.id &&
      item.size === itemToAdd.size &&
      item.color === itemToAdd.color &&
      item.finish === itemToAdd.finish
  );

  if (existingIndex >= 0) {
    const updatedCart = [...cart];
    updatedCart[existingIndex] = {
      ...updatedCart[existingIndex],
      qty: updatedCart[existingIndex].qty + itemToAdd.qty,
    };
    return updatedCart;
  }

  return [...cart, itemToAdd];
}

export function removeItem(cart: CartItem[], itemToRemove: CartItem): CartItem[] {
  return cart.filter(
    (item) =>
      !(item.id === itemToRemove.id &&
        item.size === itemToRemove.size &&
        item.color === itemToRemove.color &&
        item.finish === itemToRemove.finish)
  );
}

export function setQty(cart: CartItem[], itemToUpdate: CartItem, qty: number): CartItem[] {
  if (qty <= 0) {
    return removeItem(cart, itemToUpdate);
  }

  const existingIndex = cart.findIndex(
    (item) =>
      item.id === itemToUpdate.id &&
      item.size === itemToUpdate.size &&
      item.color === itemToUpdate.color &&
      item.finish === itemToUpdate.finish
  );

  if (existingIndex >= 0) {
    const updatedCart = [...cart];
    updatedCart[existingIndex] = {
      ...updatedCart[existingIndex],
      qty,
    };
    return updatedCart;
  }

  if (qty > 0) {
    return [...cart, { ...itemToUpdate, qty }];
  }

  return cart;
}

export function cartTotal(products: Product[], items: CartItem[]): number {
  return items.reduce((total, item) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return total;
    return total + product.price * item.qty;
  }, 0);
}

export function whatsappMessage(
  products: Product[],
  items: CartItem[],
  customer: string
): string {
  if (items.length === 0) {
    return `Olá ${customer}, meu carrinho está vazio.`;
  }

  const lines = [
    `Olá ${customer},`,
    '',
    'Pedido:',
  ];

  items.forEach((item) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return;

    const name = product.name_pt;
    const details = [];
    if (item.size) details.push(`Tamanho: ${item.size}`);
    if (item.color) details.push(`Cor: ${item.color}`);
    if (item.finish) details.push(`Acabamento: ${item.finish}`);

    lines.push(
      `- ${name} (${item.qty}x)${details.length ? ` [${details.join(', ')}]` : ''}`
    );
  });

  const total = cartTotal(products, items);
  lines.push('', `Total: R$ ${total.toFixed(2)}`);

  return lines.join('\n');
}