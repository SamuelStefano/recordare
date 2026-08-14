import { useMemo, useState } from 'react';
import { useCatalog } from '../catalog/catalog-context';
import { ProductCard } from '../components/product/ProductCard';
import { Button, ButtonLink } from '../components/ui/Button';
import { Chip, Swatch } from '../components/ui/Chip';
import { EmptyState, ErrorState, LoadingGrid } from '../components/ui/Feedback';
import { Container } from '../components/ui/Layout';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useFilters, type FilterKey } from '../hooks/useFilters';
import { useLang } from '../i18n/lang-context';
import { pluralResults } from '../lib/format';
import { applyFilters, optionsFrom } from '../lib/filter';
import { COLOR_SWATCH, CATEGORIES, categoryLabel, colorLabel, finishLabel } from '../lib/labels';

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5">
      <legend className="text-[10.5px] font-semibold tracking-[.22em] text-muted uppercase">
        {label}
      </legend>
      <div className="mt-3.5 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function CatalogPage() {
  const { lang, t } = useLang();
  const { products, status, reload } = useCatalog();
  const { filters, setFilter, toggleFilter, clear, activeCount } = useFilters();
  const [panelOpen, setPanelOpen] = useState(false);

  useDocumentMeta({
    title: `${t('catalogTitle')} · Recordare`,
    description: t('catsSub'),
    path: '/catalogo',
  });

  const sizes = useMemo(() => optionsFrom(products, 'sizes'), [products]);
  const colors = useMemo(() => optionsFrom(products, 'colors'), [products]);
  const finishes = useMemo(() => optionsFrom(products, 'finishes'), [products]);
  const visible = useMemo(
    () => applyFilters(products, filters, lang),
    [products, filters, lang]
  );

  const chip = (key: FilterKey, value: string, label: string) => (
    <Chip
      key={`${key}-${value}`}
      selected={filters[key] === value}
      onClick={() => toggleFilter(key, value)}
    >
      {label}
    </Chip>
  );

  const panel = (
    <div className="flex flex-col gap-5">
      <FilterGroup label={t('fCat')}>
        <Chip selected={filters.cat === ''} onClick={() => setFilter('cat', '')}>
          {t('allCats')}
        </Chip>
        {CATEGORIES.map((cat) => chip('cat', cat, categoryLabel(cat, lang)))}
      </FilterGroup>

      <FilterGroup label={t('fSize')}>
        {sizes.map((size) => chip('size', size, size))}
      </FilterGroup>

      <FilterGroup label={t('fColor')}>
        {colors.map((color) => (
          <Swatch
            key={color}
            color={COLOR_SWATCH[color] ?? '#EDE6D9'}
            label={colorLabel(color, lang)}
            selected={filters.color === color}
            onClick={() => toggleFilter('color', color)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('fFinish')}>
        {finishes.map((finish) => chip('finish', finish, finishLabel(finish, lang)))}
      </FilterGroup>

      {activeCount > 0 && (
        <Button variant="outline" size="sm" onClick={clear}>
          {t('clear')}
        </Button>
      )}
    </div>
  );

  return (
    <Container className="py-12 lg:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[38px] leading-[1.1] tracking-[-.01em] text-ink">
            {t('catalogTitle')}
          </h1>
          {status === 'ready' && (
            <p aria-live="polite" className="mt-2 text-[13px] text-muted">
              {pluralResults(visible.length, t('resultsOne'), t('results'))}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-muted">
            <span className="sr-only sm:not-sr-only">{t('sort')}</span>
            <select
              value={filters.sort}
              onChange={(event) => setFilter('sort', event.target.value)}
              aria-label={t('sort')}
              className="h-10 rounded-[2px] border border-line-deep bg-cream px-3 text-[13px] text-ink focus:border-brand focus:outline-none"
            >
              <option value="relevancia">{t('sortRelevance')}</option>
              <option value="preco-asc">{t('sortPriceLow')}</option>
              <option value="preco-desc">{t('sortPriceHigh')}</option>
              <option value="avaliacao">{t('sortRating')}</option>
            </select>
          </label>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((value) => !value)}
          >
            {t('filtersOpen')}
            {activeCount > 0 && ` (${activeCount})`}
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <label className="block">
          <span className="sr-only">{t('searchLabel')}</span>
          <input
            type="search"
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder={t('search')}
            className="h-11 w-full rounded-[2px] border border-line-deep bg-cream px-4 text-[13.5px] text-ink placeholder:text-faint focus:border-brand focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside aria-label={t('filters')} className="lg:sticky lg:top-[98px] lg:self-start">
          <div className={panelOpen ? 'block' : 'hidden lg:block'}>{panel}</div>
        </aside>

        <div>
          {status === 'loading' && <LoadingGrid />}
          {status === 'error' && <ErrorState onRetry={reload} />}
          {status === 'ready' &&
            (visible.length === 0 ? (
              <EmptyState
                title={t('emptyTitle')}
                body={t('emptyBody')}
                action={
                  activeCount > 0 ? (
                    <Button onClick={clear}>{t('clear')}</Button>
                  ) : (
                    <ButtonLink href="/">{t('backHome')}</ButtonLink>
                  )
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 lg:gap-[22px]">
                {visible.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index === 0} />
                ))}
              </div>
            ))}
        </div>
      </div>
    </Container>
  );
}
