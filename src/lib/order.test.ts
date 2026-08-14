import type { CartItem } from './catalog';
import { hasErrors, readReceipt, saveReceipt, validateOrder } from './order';

const items: CartItem[] = [{ id: 'p1', qty: 1 }];
const ok = { customer: 'Maria Silva', phone: '(44) 99999-0000', note: '' };

describe('validateOrder', () => {
  it('aceita pedido completo', () => {
    expect(hasErrors(validateOrder(ok, items))).toBe(false);
  });

  it('recusa nome curto ou só espaço', () => {
    expect(validateOrder({ ...ok, customer: 'M' }, items).customer).toBe('errName');
    expect(validateOrder({ ...ok, customer: '   ' }, items).customer).toBe('errName');
  });

  it('recusa nome acima do limite do banco', () => {
    expect(validateOrder({ ...ok, customer: 'a'.repeat(121) }, items).customer).toBe('errName');
  });

  it('recusa telefone com máscara vazia', () => {
    expect(validateOrder({ ...ok, phone: '(  )     -    ' }, items).phone).toBe('errPhone');
  });

  it('recusa telefone com letra e telefone curto', () => {
    expect(validateOrder({ ...ok, phone: 'liga pra mim' }, items).phone).toBe('errPhone');
    expect(validateOrder({ ...ok, phone: '99999' }, items).phone).toBe('errPhone');
  });

  it('aceita telefone internacional', () => {
    expect(validateOrder({ ...ok, phone: '+55 44 99999-0000' }, items).phone).toBeUndefined();
  });

  it('recusa observação acima de 1000 caracteres', () => {
    expect(validateOrder({ ...ok, note: 'a'.repeat(1001) }, items).note).toBe('errNote');
    expect(validateOrder({ ...ok, note: 'a'.repeat(1000) }, items).note).toBeUndefined();
  });

  it('recusa carrinho vazio e carrinho acima do teto de linhas', () => {
    expect(validateOrder(ok, []).items).toBe('errEmptyCart');
    const many = Array.from({ length: 51 }, (_, i) => ({ id: `p${i}`, qty: 1 }));
    expect(validateOrder(ok, many).items).toBe('errEmptyCart');
  });
});

describe('recibo', () => {
  beforeEach(() => sessionStorage.clear());

  it('guarda e relê o pedido da sessão', () => {
    saveReceipt({ id: 'abc', customer: 'Maria', items });
    expect(readReceipt('abc')).toEqual({ id: 'abc', customer: 'Maria', items });
  });

  it('devolve nulo para pedido desconhecido ou corrompido', () => {
    expect(readReceipt('nao-existe')).toBeNull();
    sessionStorage.setItem('recordare.order.ruim', '{quebrado');
    expect(readReceipt('ruim')).toBeNull();
  });
});
