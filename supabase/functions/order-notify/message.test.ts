import { sameSecret, summarize, toHtml, toText, whatsappFor, type OrderRecord } from './message';

const order: OrderRecord = {
  id: 'b6c7cc41-0000-4000-8000-000000000000',
  customer: 'Maria da Silva',
  phone: '(44) 99999-0000',
  note: '  Foto vai por WhatsApp  ',
  items: [
    { id: 'p1', qty: 2, size: '18x24', finish: 'fosco' },
    { id: 'saiu-do-catalogo', qty: 1 },
  ],
  total: '498.00',
  status: 'novo',
  created_at: '2026-09-26T10:00:00Z',
};

const products = [{ id: 'p1', name_pt: 'Medalhão Oval Clássico' }];

describe('summarize', () => {
  const summary = summarize(order, products);

  it('usa a mesma referência que o cliente viu na confirmação', () => {
    expect(summary.reference).toBe('B6C7CC41');
  });

  it('mantém a linha de peça que saiu do catálogo, pelo id', () => {
    expect(summary.lines).toEqual([
      '2x Medalhão Oval Clássico [18x24 · fosco]',
      '1x saiu-do-catalogo',
    ]);
  });

  it('converte o total que o PostgREST manda como texto', () => {
    expect(summary.total).toBe(498);
  });
});

describe('whatsappFor', () => {
  it('põe o DDI do Brasil em número local', () => {
    expect(whatsappFor('(44) 99999-0000')).toBe('https://wa.me/5544999990000');
  });

  it('respeita número que já veio com DDI', () => {
    expect(whatsappFor('+351 912 345 678')).toBe('https://wa.me/351912345678');
  });

  it('não inventa link para telefone curto', () => {
    expect(whatsappFor('9999-0000')).toBeNull();
  });
});

describe('toText', () => {
  it('diz que o frete ainda não está no total', () => {
    const text = toText(summarize(order, products));
    // O Intl separa "R$" do valor com espaço não-quebrável.
    expect(text).toMatch(/Total das peças: R\$\s498,00 \(frete a confirmar\)/);
    expect(text).toContain('Observação: Foto vai por WhatsApp');
  });
});

describe('toHtml', () => {
  it('escapa o que o cliente digitou', () => {
    const html = toHtml(
      summarize({ ...order, customer: '<img src=x onerror=alert(1)>', note: null }, products)
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('Observação');
  });
});

describe('sameSecret', () => {
  it('só aceita o segredo exato', () => {
    expect(sameSecret('abc123', 'abc123')).toBe(true);
    expect(sameSecret('abc12', 'abc123')).toBe(false);
    expect(sameSecret('abc1234', 'abc123')).toBe(false);
    expect(sameSecret(null, 'abc123')).toBe(false);
  });

  it('recusa tudo quando o segredo não foi configurado', () => {
    expect(sameSecret('', '')).toBe(false);
  });
});
