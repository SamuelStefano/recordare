import { makeProduct } from '../test/factories';
import { TRACK_EVENT, cartPayload, toAnalyticsItem, track } from './analytics';

const medalhao = makeProduct({ id: 'p1', sku: 'REC-MED-001', price: 249, name_en: 'Medallion' });

beforeEach(() => {
  delete window.dataLayer;
});

describe('toAnalyticsItem', () => {
  it('usa o sku e o nome em português, com a variante escolhida', () => {
    expect(toAnalyticsItem(medalhao, { qty: 2, size: '18x24', finish: 'fosco' })).toEqual({
      item_id: 'REC-MED-001',
      item_name: 'Medalhão Oval Clássico',
      item_category: 'medalhoes',
      item_variant: '18x24 / fosco',
      price: 249,
      quantity: 2,
    });
  });

  it('omite a variante quando nada foi escolhido', () => {
    expect(toAnalyticsItem(medalhao, { qty: 1 })).not.toHaveProperty('item_variant');
  });
});

describe('cartPayload', () => {
  it('soma o carrinho e ignora linha de peça que saiu do catálogo', () => {
    const payload = cartPayload(
      [medalhao],
      [
        { id: 'p1', qty: 2 },
        { id: 'sumiu', qty: 1 },
      ]
    );
    expect(payload.value).toBe(498);
    expect(payload.items).toHaveLength(1);
  });
});

describe('track', () => {
  it('zera o ecommerce antes de cada evento, senão o GA4 mescla itens do evento anterior', () => {
    track('view_item', { currency: 'BRL', value: 249 });
    track('contact', { method: 'whatsapp' });
    expect(window.dataLayer).toEqual([
      { ecommerce: null },
      { event: 'view_item', ecommerce: { currency: 'BRL', value: 249 } },
      { ecommerce: null },
      { event: 'contact', ecommerce: { method: 'whatsapp' } },
    ]);
  });

  it('avisa quem ouve pelo DOM', () => {
    const listener = vi.fn();
    window.addEventListener(TRACK_EVENT, listener);
    track('view_cart');
    window.removeEventListener(TRACK_EVENT, listener);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      event: 'view_cart',
      ecommerce: {},
    });
  });

  it('não derruba a loja se o dataLayer vier quebrado de um script de terceiro', () => {
    window.dataLayer = { push: () => { throw new Error('tag quebrada'); } } as unknown as unknown[];
    expect(() => track('view_cart')).not.toThrow();
  });
});
