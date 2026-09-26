// Sem import de fora desta pasta: o bundler das Edge Functions empacota só o diretório da função,
// e o Vitest da loja testa este arquivo sem precisar de Deno.

export interface OrderRecord {
  id: string;
  customer: string;
  phone: string;
  note: string | null;
  items: { id: string; qty: number; size?: string; color?: string; finish?: string }[];
  total: number | string;
  status: string;
  created_at: string;
}

export interface ProductName {
  id: string;
  name_pt: string;
}

export interface OrderSummary {
  reference: string;
  customer: string;
  phone: string;
  whatsapp: string | null;
  note: string | null;
  lines: string[];
  /** Total das peças recalculado pelo banco. Frete é confirmado no atendimento. */
  total: number;
  createdAt: string;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Mesmo formato da referência mostrada ao cliente na confirmação: é o número que ele vai citar.
export function orderReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

// O telefone chega como o cliente digitou. Sem DDI, é número brasileiro — e o link já abre a
// conversa com um toque em vez de alguém redigitar onze dígitos.
export function whatsappFor(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}

export function summarize(order: OrderRecord, products: ProductName[]): OrderSummary {
  const names = new Map(products.map((p) => [p.id, p.name_pt]));
  return {
    reference: orderReference(order.id),
    customer: order.customer,
    phone: order.phone,
    whatsapp: whatsappFor(order.phone),
    note: order.note?.trim() || null,
    lines: order.items.map((item) => {
      const variant = [item.size, item.color, item.finish].filter(Boolean).join(' · ');
      // Peça que saiu do catálogo depois do pedido ainda aparece, pelo id: sumir com a linha
      // faria o aviso mentir sobre o que o cliente pediu.
      const name = names.get(item.id) ?? item.id;
      return `${item.qty}x ${name}${variant ? ` [${variant}]` : ''}`;
    }),
    total: Number(order.total),
    createdAt: order.created_at,
  };
}

export function toText(summary: OrderSummary): string {
  return [
    `Pedido novo ${summary.reference}`,
    '',
    `Cliente: ${summary.customer}`,
    `Telefone: ${summary.phone}`,
    ...(summary.whatsapp ? [`WhatsApp: ${summary.whatsapp}`] : []),
    '',
    ...summary.lines.map((line) => `- ${line}`),
    '',
    `Total das peças: ${BRL.format(summary.total)} (frete a confirmar)`,
    ...(summary.note ? ['', `Observação: ${summary.note}`] : []),
  ].join('\n');
}

function html(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Nome, observação e telefone vêm de um formulário anônimo: tudo passa por escape antes de virar
// HTML, senão um pedido com <img src=x onerror=...> no nome roda script no leitor de e-mail.
export function toHtml(summary: OrderSummary): string {
  const whatsapp = summary.whatsapp
    ? ` · <a href="${html(summary.whatsapp)}">abrir no WhatsApp</a>`
    : '';
  return [
    `<h2>Pedido novo ${html(summary.reference)}</h2>`,
    `<p><strong>${html(summary.customer)}</strong><br>${html(summary.phone)}${whatsapp}</p>`,
    `<ul>${summary.lines.map((line) => `<li>${html(line)}</li>`).join('')}</ul>`,
    `<p>Total das peças: <strong>${html(BRL.format(summary.total))}</strong> (frete a confirmar)</p>`,
    summary.note ? `<p>Observação: ${html(summary.note)}</p>` : '',
  ].join('\n');
}

/** Comparação em tempo constante: `===` vaza, pelo tempo de resposta, quantos caracteres bateram. */
export function sameSecret(received: string | null, expected: string): boolean {
  if (!received || !expected) return false;
  const a = new TextEncoder().encode(received);
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}
