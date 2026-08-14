import type { CartItem } from './catalog';
import type { TranslationKey } from './i18n';

export interface OrderDraft {
  customer: string;
  phone: string;
  note: string;
}

export interface OrderErrors {
  customer?: TranslationKey;
  phone?: TranslationKey;
  note?: TranslationKey;
  items?: TranslationKey;
}

// Espelha os CHECKs de `recordare.orders`. Validar aqui é conveniência para o cliente,
// não segurança: o banco continua sendo quem recusa de verdade.
export const MAX_NOTE = 1000;
export const MAX_ITEMS = 50;

const PHONE_ALLOWED = /^[0-9+() -]{8,20}$/;

export function validateOrder(draft: OrderDraft, items: CartItem[]): OrderErrors {
  const errors: OrderErrors = {};
  const customer = draft.customer.trim();
  const phone = draft.phone.trim();

  if (customer.length < 2 || customer.length > 120) errors.customer = 'errName';

  // Conta os dígitos além de casar a máscara: "(  )   -  " passa no formato e não é
  // telefone nenhum.
  const digits = phone.replace(/\D/g, '');
  if (!PHONE_ALLOWED.test(phone) || digits.length < 10 || digits.length > 15) {
    errors.phone = 'errPhone';
  }

  if (draft.note.length > MAX_NOTE) errors.note = 'errNote';
  if (items.length === 0 || items.length > MAX_ITEMS) errors.items = 'errEmptyCart';

  return errors;
}

export function hasErrors(errors: OrderErrors): boolean {
  return Object.keys(errors).length > 0;
}

export interface OrderReceipt {
  id: string;
  customer: string;
  items: CartItem[];
}

// `orders` não tem policy de SELECT, então a tela de confirmação não consegue reler o
// pedido do banco. O recibo fica em sessionStorage para a página sobreviver a um F5 e
// sumir quando a aba fechar — nada aqui é fonte de verdade, só o que mostrar na tela.
const RECEIPT_PREFIX = 'recordare.order.';

export function saveReceipt(receipt: OrderReceipt): void {
  try {
    sessionStorage.setItem(RECEIPT_PREFIX + receipt.id, JSON.stringify(receipt));
  } catch {
    // Sem recibo salvo a confirmação ainda mostra o número do pedido pela URL.
  }
}

export function readReceipt(id: string): OrderReceipt | null {
  try {
    const raw = sessionStorage.getItem(RECEIPT_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrderReceipt;
    return parsed && Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}
