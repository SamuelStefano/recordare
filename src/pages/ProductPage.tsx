import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'wouter';
import { useCart } from '../cart/cart-context';
import { useCatalog } from '../catalog/catalog-context';
import { ProductCard } from '../components/product/ProductCard';
import { Badge } from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Chip, Swatch } from '../components/ui/Chip';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { Container } from '../components/ui/Layout';
import { ProductImage } from '../components/ui/ProductImage';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLang } from '../i18n/lang-context';
import type { Product } from '../lib/catalog';
import { estimateArea } from '../lib/area';
import { relatedTo } from '../lib/filter';
import { money } from '../lib/format';
import { siteUrl } from '../lib/site';
import {
  COLOR_SWATCH,
  categoryLabel,
  colorLabel,
  finishLabel,
  productBadge,
  productDescription,
  productName,
} from '../lib/labels';
import { Price, Stars } from '../components/ui/Price';

function AreaCalculator({ product, size }: { product: Product; size: string | undefined }) {
  const { t } = useLang();
  const [input, setInput] = useState('');
  const area = Number(input.replace(',', '.'));
  const estimate = estimateArea(area, size, product.price);

  return (
    <section className="mt-8 rounded-[3px] border border-line bg-cream p-6">
      <h2 className="font-serif text-[22px] tracking-[-.01em] text-ink">{t('calcTitle')}</h2>
      <p className="mt-1 text-[12.5px] text-muted">{t('calcDesc')}</p>

      <label className="mt-5 block">
        <span className="text-[10.5px] font-semibold tracking-[.22em] text-muted uppercase">
          {t('calcArea')}
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="mt-2 h-11 w-full rounded-[2px] border border-line-deep bg-bg px-3.5 text-[13.5px] text-ink focus:border-brand focus:outline-none"
        />
      </label>

      {estimate.area > 0 && (
        <dl aria-live="polite" className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
          <div className="flex items-baseline justify-between">
            <dt className="text-[13px] text-muted">{t('calcResult')}</dt>
            <dd className="font-serif text-[26px] tracking-[-.01em] text-ink">
              {estimate.boxes} {t('boxes')}
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-[13px] text-muted">{t('estimate')}</dt>
            <dd className="text-[16px] font-semibold text-ink">{money(estimate.cost)}</dd>
          </div>
          <p className="text-[12px] text-faint">{t('estimateNote')}</p>
        </dl>
      )}
    </section>
  );
}

function ProductDetail({ product }: { product: Product }) {
  const { lang, t } = useLang();
  const { products } = useCatalog();
  const { add } = useCart();

  const [size, setSize] = useState<string | undefined>(product.sizes[0]);
  const [color, setColor] = useState<string | undefined>(product.colors[0]);
  const [finish, setFinish] = useState<string | undefined>(product.finishes[0]);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setSize(product.sizes[0]);
    setColor(product.colors[0]);
    setFinish(product.finishes[0]);
    setJustAdded(false);
  }, [product]);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const related = useMemo(() => relatedTo(products, product), [products, product]);
  const badge = productBadge(product, lang);
  const soldOut = product.stock <= 0;

  const name = productName(product, lang);
  const description = productDescription(product, lang);
  const path = `/peca/${product.slug}`;
  useDocumentMeta({
    title: `${name} · Recordare`,
    description,
    path,
    image: product.img,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      image: product.img,
      sku: product.sku,
      brand: { '@type': 'Brand', name: 'Recordare' },
      offers: {
        '@type': 'Offer',
        price: product.price.toFixed(2),
        priceCurrency: 'BRL',
        availability: soldOut
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
        url: siteUrl(path),
      },
    },
  });

  return (
    <Container className="py-12 lg:py-16">
      <ButtonLink href="/catalogo" variant="ghost" size="sm" className="-ml-4">
        ← {t('backCatalog')}
      </ButtonLink>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-[52px]">
        <div className="relative overflow-hidden rounded-[3px]">
          <ProductImage
            src={product.img}
            alt={productName(product, lang)}
            width={900}
            height={900}
            priority
            sizes="(max-width: 1024px) 100vw, 620px"
            className="aspect-square w-full object-cover"
          />
          {badge && (
            <span className="absolute top-4 left-4">
              <Badge>{badge}</Badge>
            </span>
          )}
        </div>

        <div className="lg:sticky lg:top-[98px] lg:self-start">
          <span className="text-[10px] font-semibold tracking-[.22em] text-faint uppercase">
            {categoryLabel(product.cat, lang)}
          </span>
          <h1 className="mt-2 font-serif text-[36px] leading-[1.08] tracking-[-.01em] text-ink sm:text-[42px]">
            {productName(product, lang)}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <Stars rating={product.rating} reviews={product.reviews} />
            <span className="text-[12.5px] text-faint">{t('pReviews')}</span>
          </div>

          <Price
            value={product.price}
            unit={product.unit}
            className="mt-5 block font-serif text-[34px] tracking-[-.01em] text-ink"
          />

          {product.sizes.length > 0 && (
            <div className="mt-7">
              <span className="text-[10.5px] font-semibold tracking-[.22em] text-muted uppercase">
                {t('chooseSize')}
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((option) => (
                  <Chip key={option} selected={size === option} onClick={() => setSize(option)}>
                    {option}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="mt-6">
              <span className="text-[10.5px] font-semibold tracking-[.22em] text-muted uppercase">
                {t('chooseColor')}
              </span>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.colors.map((option) => (
                  <Swatch
                    key={option}
                    color={COLOR_SWATCH[option] ?? '#EDE6D9'}
                    label={colorLabel(option, lang)}
                    selected={color === option}
                    onClick={() => setColor(option)}
                  />
                ))}
              </div>
            </div>
          )}

          {product.finishes.length > 0 && (
            <div className="mt-6">
              <span className="text-[10.5px] font-semibold tracking-[.22em] text-muted uppercase">
                {t('chooseFinish')}
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.finishes.map((option) => (
                  <Chip
                    key={option}
                    selected={finish === option}
                    onClick={() => setFinish(option)}
                  >
                    {finishLabel(option, lang)}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              disabled={soldOut}
              onClick={() => {
                add({ id: product.id, qty: 1, size, color, finish });
                setJustAdded(true);
              }}
            >
              {soldOut ? t('soldOut') : justAdded ? t('added') : t('addCart')}
            </Button>
            {product.ml_permalink && (
              <a
                href={product.ml_permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12.5px] text-brand underline-offset-4 hover:underline"
              >
                {t('mlBadge')} ↗
              </a>
            )}
          </div>
          {/* aria-live fora do botão: trocar o rótulo do próprio botão que acabou de ser
              pressionado nem sempre é anunciado pelos leitores de tela. */}
          <p aria-live="polite" className="sr-only">
            {justAdded ? t('added') : ''}
          </p>

          <section className="mt-9 border-t border-line pt-6">
            <h2 className="text-[10.5px] font-semibold tracking-[.22em] text-muted uppercase">
              {t('pDesc')}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
              {productDescription(product, lang)}
            </p>
          </section>

          {product.unit === 'm2' && <AreaCalculator product={product} size={size} />}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-serif text-[32px] tracking-[-.01em] text-ink">
            {t('pRelated')}
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-[22px]">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

function ProductMissing() {
  const { t } = useLang();
  useDocumentMeta({
    title: `${t('notFoundTitle')} · Recordare`,
    description: t('notFoundBody'),
    noindex: true,
  });

  return (
    <Container className="py-16">
      <EmptyState
        as="h1"
        title={t('notFoundTitle')}
        body={t('notFoundBody')}
        action={<ButtonLink href="/catalogo">{t('backCatalog')}</ButtonLink>}
      />
    </Container>
  );
}

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, status, reload } = useCatalog();

  if (status === 'loading') {
    return (
      <Container className="grid gap-10 py-16 lg:grid-cols-[1.1fr_1fr]">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container className="py-16">
        <ErrorState onRetry={reload} />
      </Container>
    );
  }

  const product = products.find((item) => item.slug === slug);
  if (!product) return <ProductMissing />;

  return <ProductDetail product={product} />;
}
