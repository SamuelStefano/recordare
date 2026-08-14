// Preço sempre em BRL, inclusive na loja em inglês: quem compra paga em real, e
// "R$ 249,00" traduzido para "$249.00" seria uma promessa de outro valor.
const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value: number): string {
  return BRL.format(Number.isFinite(value) ? value : 0);
}

export function ratingLabel(rating: number, reviews: number): string {
  return `★ ${rating.toFixed(1)} (${reviews})`;
}

export function pluralResults(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
