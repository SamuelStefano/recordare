import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../cart/cart-context';
import { useCatalog } from '../catalog/catalog-context';
import { Button, ButtonLink } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';
import { Field, TextArea } from '../components/ui/Field';
import { Container } from '../components/ui/Layout';
import { ProductImage } from '../components/ui/ProductImage';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLang } from '../i18n/lang-context';
import { FREE_SHIPPING_FROM, MAX_QTY, cartTotal, shippingFor } from '../lib/cart';
import { createOrder, type CartItem } from '../lib/catalog';
import { money } from '../lib/format';
import { productName, variantLabel } from '../lib/labels';
import { MAX_NOTE, hasErrors, saveReceipt, validateOrder, type OrderErrors } from '../lib/order';

function QtyStepper({ item }: { item: CartItem }) {
  const { t } = useLang();
  const { setQty } = useCart();

  return (
    <div className="inline-flex items-center border border-line-deep">
      <button
        type="button"
        aria-label={t('decrease')}
        onClick={() => setQty(item, item.qty - 1)}
        className="size-9 text-ink transition-colors duration-200 hover:text-brand"
      >
        −
      </button>
      <span aria-label={t('qtyLabel')} className="w-9 text-center text-[13.5px] tabular-nums">
        {item.qty}
      </span>
      <button
        type="button"
        aria-label={t('increase')}
        disabled={item.qty >= MAX_QTY}
        onClick={() => setQty(item, item.qty + 1)}
        className="size-9 text-ink transition-colors duration-200 hover:text-brand disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function CartLines() {
  const { lang, t } = useLang();
  const { items, remove } = useCart();
  const { products } = useCatalog();

  return (
    <ul aria-label={t('cartTitle')} className="flex flex-col">
      {items.map((item, index) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return null;
        const variant = variantLabel(lang, item);

        return (
          <li
            key={`${item.id}-${index}`}
            className="flex gap-4 border-b border-line py-5 first:border-t"
          >
            <ProductImage
              src={product.img}
              alt={productName(product, lang)}
              width={180}
              height={180}
              sizes="90px"
              className="size-[90px] shrink-0 rounded-[3px] object-cover"
            />
            <div className="flex flex-1 flex-col gap-1.5">
              <h3 className="font-serif text-[19px] leading-tight tracking-[-.01em] text-ink">
                {productName(product, lang)}
              </h3>
              {variant && <p className="text-[12.5px] text-muted">{variant}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
                <QtyStepper item={item} />
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="text-[12px] tracking-[.08em] text-muted uppercase transition-colors duration-200 hover:text-brand"
                >
                  {t('remove')}
                </button>
              </div>
            </div>
            <span className="text-[15px] font-semibold whitespace-nowrap text-ink">
              {money(product.price * item.qty)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function CartPage() {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const { items, clear, dropped, dismissDropped } = useCart();
  const { products } = useCatalog();

  const [draft, setDraft] = useState({ customer: '', phone: '', note: '' });
  const [errors, setErrors] = useState<OrderErrors>({});
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  useDocumentMeta({
    title: `${t('cartTitle')} · Recordare`,
    description: t('formSub'),
    path: '/carrinho',
    noindex: true,
  });

  const subtotal = cartTotal(products, items);
  const shipping = shippingFor(subtotal);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateOrder(draft, items);
    setErrors(found);
    setFailed(false);
    if (hasErrors(found)) return;

    setSending(true);
    try {
      const id = await createOrder({
        customer: draft.customer.trim(),
        phone: draft.phone.trim(),
        note: draft.note.trim() || undefined,
        items,
      });
      saveReceipt({ id, customer: draft.customer.trim(), items });
      // Só limpa depois que o banco confirmou: falha de rede não pode apagar o carrinho.
      clear();
      navigate(`/pedido/${id}`);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  if (items.length === 0) {
    return (
      <Container wide={false} className="py-16">
        <EmptyState
          as="h1"
          title={t('cartEmpty')}
          body={t('emptyBody')}
          action={<ButtonLink href="/catalogo">{t('cartBrowse')}</ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <Container wide={false} className="py-12 lg:py-16">
      <h1 className="mb-8 font-serif text-[38px] leading-[1.1] tracking-[-.01em] text-ink">
        {t('cartTitle')}
      </h1>

      {dropped && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between gap-4 border border-line-deep bg-cream-dim px-4 py-3 text-[13px] text-ink-soft"
        >
          <span>{t('cartDropped')}</span>
          <button type="button" onClick={dismissDropped} aria-label={t('closeMenu')}>
            ✕
          </button>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_330px]">
        <div>
          <CartLines />

          <form onSubmit={submit} noValidate className="mt-10 flex flex-col gap-5">
            <div>
              <h2 className="font-serif text-[26px] tracking-[-.01em] text-ink">{t('formTitle')}</h2>
              <p className="mt-1 text-[13px] text-muted">{t('formSub')}</p>
            </div>

            <Field
              label={t('fieldName')}
              value={draft.customer}
              autoComplete="name"
              required
              onChange={(event) => setDraft({ ...draft, customer: event.target.value })}
              error={errors.customer && t(errors.customer)}
            />
            <Field
              label={t('fieldPhone')}
              value={draft.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              error={errors.phone && t(errors.phone)}
            />
            <TextArea
              label={t('fieldNote')}
              value={draft.note}
              maxLength={MAX_NOTE}
              placeholder={t('fieldNotePlaceholder')}
              onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              error={errors.note && t(errors.note)}
              hint={`${draft.note.length}/${MAX_NOTE}`}
            />

            {failed && (
              <p role="alert" className="text-[13px] text-brand-dark">
                {t('errSubmit')}
              </p>
            )}

            <Button type="submit" size="lg" disabled={sending} className="self-start">
              {sending ? t('submitting') : t('submit')}
            </Button>
          </form>
        </div>

        <aside className="lg:sticky lg:top-[98px] lg:self-start">
          <div className="border border-line bg-cream p-6">
            <dl className="flex flex-col gap-3 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">{t('subtotal')}</dt>
                <dd className="text-ink">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('shipping')}</dt>
                <dd className="text-ink">{shipping === 0 ? t('shippingFree') : money(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <dt className="font-semibold text-ink">{t('total')}</dt>
                <dd className="font-serif text-[24px] tracking-[-.01em] text-ink">
                  {money(subtotal + shipping)}
                </dd>
              </div>
            </dl>
            {subtotal < FREE_SHIPPING_FROM && (
              <p className="mt-4 border-t border-line pt-4 text-[12px] text-muted">
                {t('shippingNote')}
              </p>
            )}
            <p className="mt-4 text-[12px] text-faint">
              {t('finalPriceNote')}
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
