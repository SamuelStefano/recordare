import { act } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { useCart, type CartValue } from './cart-context';

let cart: CartValue;
function Probe() {
  cart = useCart();
  return null;
}

const tracked = () =>
  (window.dataLayer ?? []).flatMap((entry) =>
    entry && typeof entry === 'object' && 'event' in entry
      ? [entry as { event: string; ecommerce: { items: { quantity: number }[] } }]
      : []
  );

beforeEach(() => {
  localStorage.clear();
  delete window.dataLayer;
});

describe('medição do carrinho', () => {
  it('mede a quantidade que de fato mudou, não a que foi pedida', () => {
    renderWithProviders(<Probe />);
    const line = { id: 'p1', qty: 1, size: '13x18' };

    act(() => cart.setQty(line, 98));
    act(() => cart.add({ ...line, qty: 5 }));
    act(() => cart.setQty(line, 90));
    act(() => cart.remove(line));

    expect(tracked().map((e) => [e.event, e.ecommerce.items[0].quantity])).toEqual([
      ['add_to_cart', 98],
      // O teto é 99: dos 5 pedidos, só 1 entrou.
      ['add_to_cart', 1],
      ['remove_from_cart', 9],
      ['remove_from_cart', 90],
    ]);
  });

  it('não mede nada quando a conta não muda', () => {
    renderWithProviders(<Probe />);
    act(() => cart.remove({ id: 'p1', qty: 1 }));
    expect(tracked()).toEqual([]);
  });
});
