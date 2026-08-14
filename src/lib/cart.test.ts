import type { CartItem } from './catalog';
import { makeProduct } from '../test/factories';
import { money } from './format';
import {
  MAX_QTY,
  addItem,
  cartCount,
  cartTotal,
  removeItem,
  sanitizeCart,
  setQty,
  shippingFor,
  whatsappLink,
  whatsappMessage,
} from './cart';

const medalhao = makeProduct({
  id: 'p1',
  price: 100,
  name_pt: 'Medalhão Oval Clássico',
  name_en: 'Classic Oval Medallion',
  sizes: ['13x18', '18x24'],
  colors: ['branco', 'marfim'],
  finishes: ['fosco', 'brilhante'],
});

const lapide = makeProduct({
  id: 'p2',
  cat: 'lapides',
  price: 500,
  name_pt: 'Placa Retangular Memória',
  name_en: 'Rectangular Memory Plaque',
  sizes: ['24x30'],
  colors: ['preto'],
  finishes: ['fosco'],
});

const products = [medalhao, lapide];

describe('addItem', () => {
  it('soma quantidade quando a variante é idêntica', () => {
    const cart = addItem([{ id: 'p1', qty: 1, size: '13x18' }], { id: 'p1', qty: 2, size: '13x18' });
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
  });

  it('cria linha nova quando só a opção muda', () => {
    const cart = addItem([{ id: 'p1', qty: 1, size: '13x18' }], { id: 'p1', qty: 1, size: '18x24' });
    expect(cart).toHaveLength(2);
  });

  it('respeita o teto de quantidade por linha', () => {
    const cart = addItem([{ id: 'p1', qty: MAX_QTY }], { id: 'p1', qty: 50 });
    expect(cart[0].qty).toBe(MAX_QTY);
  });
});

describe('setQty', () => {
  it('remove a linha quando a quantidade chega a zero', () => {
    expect(setQty([{ id: 'p1', qty: 2 }], { id: 'p1', qty: 2 }, 0)).toEqual([]);
  });

  it('atualiza a quantidade da variante certa', () => {
    const cart = setQty(
      [
        { id: 'p1', qty: 1, size: '13x18' },
        { id: 'p1', qty: 1, size: '18x24' },
      ],
      { id: 'p1', qty: 1, size: '18x24' },
      5
    );
    expect(cart[0].qty).toBe(1);
    expect(cart[1].qty).toBe(5);
  });
});

describe('removeItem', () => {
  it('remove só a variante indicada', () => {
    const cart = removeItem(
      [
        { id: 'p1', qty: 1, size: '13x18' },
        { id: 'p1', qty: 1, size: '18x24' },
      ],
      { id: 'p1', qty: 1, size: '13x18' }
    );
    expect(cart).toEqual([{ id: 'p1', qty: 1, size: '18x24' }]);
  });
});

describe('cartTotal e cartCount', () => {
  it('zera com carrinho vazio', () => {
    expect(cartTotal(products, [])).toBe(0);
    expect(cartCount([])).toBe(0);
  });

  it('soma preço vigente por quantidade', () => {
    const items: CartItem[] = [
      { id: 'p1', qty: 1 },
      { id: 'p2', qty: 2 },
    ];
    expect(cartTotal(products, items)).toBe(1100);
    expect(cartCount(items)).toBe(3);
  });

  it('ignora item cujo produto sumiu do catálogo', () => {
    expect(cartTotal(products, [{ id: 'p1', qty: 1 }, { id: 'sumiu', qty: 5 }])).toBe(100);
  });
});

describe('shippingFor', () => {
  it('não cobra frete de carrinho vazio', () => {
    expect(shippingFor(0)).toBe(0);
  });

  it('cobra frete abaixo do piso', () => {
    expect(shippingFor(349.99)).toBe(39.9);
  });

  it('isenta a partir do piso', () => {
    expect(shippingFor(350)).toBe(0);
  });
});

describe('sanitizeCart', () => {
  it('devolve vazio para qualquer coisa que não seja array', () => {
    expect(sanitizeCart(null, products)).toEqual([]);
    expect(sanitizeCart('[]', products)).toEqual([]);
    expect(sanitizeCart({ id: 'p1' }, products)).toEqual([]);
  });

  it('descarta produto que saiu do catálogo', () => {
    expect(sanitizeCart([{ id: 'fora', qty: 2 }], products)).toEqual([]);
  });

  it('descarta quantidade inválida', () => {
    expect(sanitizeCart([{ id: 'p1', qty: 0 }], products)).toEqual([]);
    expect(sanitizeCart([{ id: 'p1', qty: -3 }], products)).toEqual([]);
    expect(sanitizeCart([{ id: 'p1', qty: 'muitas' }], products)).toEqual([]);
    expect(sanitizeCart([{ id: 'p1', qty: Number.POSITIVE_INFINITY }], products)).toEqual([]);
  });

  it('limita quantidade adulterada ao teto', () => {
    expect(sanitizeCart([{ id: 'p1', qty: 10_000_000 }], products)).toEqual([
      { id: 'p1', qty: MAX_QTY },
    ]);
  });

  it('descarta opção que o produto não oferece', () => {
    expect(sanitizeCart([{ id: 'p1', qty: 1, size: '99x99', color: 'dourado' }], products)).toEqual([
      { id: 'p1', qty: 1 },
    ]);
  });

  it('mantém opção válida', () => {
    expect(
      sanitizeCart([{ id: 'p1', qty: 2, size: '18x24', color: 'marfim', finish: 'fosco' }], products)
    ).toEqual([{ id: 'p1', qty: 2, size: '18x24', color: 'marfim', finish: 'fosco' }]);
  });

  it('funde linhas que viraram a mesma variante depois do descarte', () => {
    const cart = sanitizeCart(
      [
        { id: 'p1', qty: 1, size: 'inexistente' },
        { id: 'p1', qty: 2, size: 'outro-inexistente' },
      ],
      products
    );
    expect(cart).toEqual([{ id: 'p1', qty: 3 }]);
  });
});

describe('whatsappMessage', () => {
  const items: CartItem[] = [
    { id: 'p1', qty: 2, size: '18x24', color: 'marfim', finish: 'fosco' },
    { id: 'p2', qty: 1 },
  ];

  it('monta o pedido em português', () => {
    const message = whatsappMessage(products, items, { lang: 'pt', customer: 'Maria' });
    expect(message).toContain('Olá Maria,');
    expect(message).toContain('Pedido:');
    expect(message).toContain('- Medalhão Oval Clássico (2x) [18x24 · Marfim · Fosco]');
    expect(message).toContain('- Placa Retangular Memória (1x)');
    expect(message).toContain(`Total: ${money(700)}`);
  });

  it('monta o pedido em inglês quando a loja está em inglês', () => {
    const message = whatsappMessage(products, items, { lang: 'en', customer: 'Mary' });
    expect(message).toContain('Hello Mary,');
    expect(message).toContain('Order:');
    expect(message).toContain('- Classic Oval Medallion (2x) [18x24 · Ivory · Matte]');
    expect(message).not.toContain('Pedido:');
  });

  it('inclui a referência do pedido quando existe', () => {
    const message = whatsappMessage(products, items, {
      lang: 'pt',
      customer: 'Maria',
      reference: 'A1B2C3D4',
    });
    expect(message).toContain('Referência: A1B2C3D4');
  });

  it('não gera colchete vazio quando não há opção', () => {
    const message = whatsappMessage(products, [{ id: 'p2', qty: 1 }], {
      lang: 'pt',
      customer: 'Ana',
    });
    expect(message).not.toContain('[');
  });
});

describe('whatsappLink', () => {
  it('recusa número ausente ou inválido', () => {
    expect(whatsappLink(undefined, 'oi')).toBeNull();
    expect(whatsappLink('', 'oi')).toBeNull();
    expect(whatsappLink('seu-numero-aqui', 'oi')).toBeNull();
    expect(whatsappLink('123', 'oi')).toBeNull();
  });

  it('aceita número internacional e escapa a mensagem', () => {
    const link = whatsappLink('+55 (44) 99999-0000', 'Olá & tchau');
    expect(link).toBe('https://wa.me/5544999990000?text=Ol%C3%A1%20%26%20tchau');
  });
});
