import type { Product, CartItem } from './catalog';
import { cartTotal, whatsappMessage } from './cart';

// Mock products for testing
const mockProducts: Product[] = [
  {
    id: '1',
    cat: 'medalhoes',
    name_pt: 'Medalhão de Ouro',
    name_en: 'Gold Medal',
    desc_pt: 'Descrição em português',
    desc_en: 'Description in English',
    badge_pt: null,
    badge_en: null,
    price: 100.0,
    unit: 'un',
    img: '',
    sizes: ['Único'],
    colors: ['Ouro'],
    finishes: ['Polido'],
    rating: 5,
    reviews: 10,
  },
  {
    id: '2',
    cat: 'lapides',
    name_pt: 'Lapide de Granito',
    name_en: 'Granite Tombstone',
    desc_pt: 'Descrição em português',
    desc_en: 'Description in English',
    badge_pt: null,
    badge_en: null,
    price: 500.0,
    unit: 'un',
    img: '',
    sizes: ['Único'],
    colors: ['Cinza'],
    finishes: ['Natural'],
    rating: 4,
    reviews: 5,
  },
];

describe('cartTotal', () => {
  it('should return 0 for empty cart', () => {
    expect(cartTotal(mockProducts, [])).toBe(0);
  });

  it('should calculate total for single item', () => {
    const items: CartItem[] = [{ id: '1', qty: 2 }];
    expect(cartTotal(mockProducts, items)).toBe(200);
  });

  it('should calculate total for multiple items', () => {
    const items: CartItem[] = [
      { id: '1', qty: 1 },
      { id: '2', qty: 2 },
    ];
    expect(cartTotal(mockProducts, items)).toBe(100 + 2 * 500); // 1100
  });

  it('should ignore items with non-existent product id', () => {
    const items: CartItem[] = [
      { id: '1', qty: 1 },
      { id: '999', qty: 5 }, // non-existent
    ];
    expect(cartTotal(mockProducts, items)).toBe(100);
  });
});

describe('whatsappMessage', () => {
  it('should return empty cart message', () => {
    const message = whatsappMessage(mockProducts, [], 'João');
    expect(message).toBe('Olá João, meu carrinho está vazio.');
  });

  it('should format message with single item', () => {
    const items: CartItem[] = [{ id: '1', qty: 2 }];
    const message = whatsappMessage(mockProducts, items, 'Maria');
    expect(message).toContain('Olá Maria,');
    expect(message).toContain('Pedido:');
    expect(message).toContain('- Medalhão de Ouro (2x)');
    expect(message).toContain('Total: R$ 200.00');
  });

  it('should format message with multiple items and options', () => {
    const items: CartItem[] = [
      { id: '1', qty: 1, size: 'Único', color: 'Ouro', finish: 'Polido' },
      { id: '2', qty: 1 },
    ];
    const message = whatsappMessage(mockProducts, items, 'José');
    expect(message).toContain('- Medalhão de Ouro (1x) [Tamanho: Único, Cor: Ouro, Acabamento: Polido]');
    expect(message).toContain('- Lapide de Granito (1x)');
    expect(message).toContain('Total: R$ 600.00');
  });

  it('should handle product with missing optional fields', () => {
    const items: CartItem[] = [{ id: '1', qty: 1 }]; // no size, color, finish
    const message = whatsappMessage(mockProducts, items, 'Ana');
    expect(message).toContain('- Medalhão de Ouro (1x)');
    expect(message).not.toContain('['); // no brackets for empty details
  });
});