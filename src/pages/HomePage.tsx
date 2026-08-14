import { Link } from 'wouter';
import { useCatalog } from '../catalog/catalog-context';
import { ProductCard } from '../components/product/ProductCard';
import { Eyebrow } from '../components/ui/Badge';
import { ButtonLink } from '../components/ui/Button';
import { ErrorState, LoadingGrid } from '../components/ui/Feedback';
import { Container, SectionHeader } from '../components/ui/Layout';
import { ProductImage } from '../components/ui/ProductImage';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLang } from '../i18n/lang-context';
import { CATEGORIES, categoryDescription, categoryLabel } from '../lib/labels';

function Hero() {
  const { t } = useLang();
  return (
    <section className="border-b border-line bg-gradient-to-r from-sand-deep to-cream">
      <Container className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <Eyebrow>{t('heroEyebrow')}</Eyebrow>
          <h1 className="mt-5 font-serif text-[44px] leading-[1.05] tracking-[-.01em] text-ink sm:text-[58px]">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">{t('heroSub')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/catalogo" size="lg">
              {t('heroCta')}
            </ButtonLink>
            <a href="#processo" className="inline-flex h-[52px] items-center rounded-[2px] border border-line-deep px-8 text-[14px] text-ink transition-colors duration-200 hover:border-brand hover:text-brand">
              {t('heroCta2')}
            </a>
          </div>
        </div>
        <div className="rounded-[4px] bg-stone">
          <ProductImage
            src="https://commons.wikimedia.org/wiki/Special:FilePath/Louisa%20May%20Alcott%2C%20c.%201870%20-%20Warren%27s%20Portraits%2C%20Boston.jpg?width=900"
            alt={t('heroAlt')}
            width={900}
            height={700}
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="aspect-[9/7] w-full rounded-[4px] object-cover"
          />
        </div>
      </Container>
    </section>
  );
}

function Categories() {
  const { lang, t } = useLang();
  return (
    <Container className="py-20">
      <SectionHeader title={t('catsTitle')} sub={t('catsSub')} />
      <ul className="grid grid-cols-2 gap-[18px] lg:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <li key={cat}>
            <Link
              href={`/catalogo?cat=${cat}`}
              className="flex h-full flex-col justify-end rounded-[3px] border border-line bg-cream p-6 transition-colors duration-200 hover:border-brand"
            >
              <span className="font-serif text-[22px] tracking-[-.01em] text-ink">
                {categoryLabel(cat, lang)}
              </span>
              <span className="mt-1.5 text-[12.5px] text-muted">
                {categoryDescription(cat, lang)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}

function Featured() {
  const { t } = useLang();
  const { products, status, reload } = useCatalog();

  return (
    <Container className="pb-20">
      <SectionHeader
        title={t('featTitle')}
        sub={t('featSub')}
        action={
          <Link href="/catalogo" className="text-[12.5px] tracking-[.08em] text-brand uppercase hover:text-brand-dark">
            {t('viewAll')} →
          </Link>
        }
      />
      {status === 'loading' && <LoadingGrid count={4} />}
      {status === 'error' && <ErrorState onRetry={reload} />}
      {status === 'ready' && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-[22px]">
          {products.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index === 0} />
          ))}
        </div>
      )}
    </Container>
  );
}

function Process() {
  const { t } = useLang();
  const steps = [
    { title: t('proc1Title'), desc: t('proc1Desc') },
    { title: t('proc2Title'), desc: t('proc2Desc') },
    { title: t('proc3Title'), desc: t('proc3Desc') },
  ];

  return (
    <section id="processo" className="border-y border-line bg-cream">
      <Container className="py-20">
        <SectionHeader title={t('procTitle')} sub={t('procSub')} />
        <ol className="grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-brand pt-6">
              <span className="font-serif text-[38px] leading-none font-medium text-brand">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-serif text-[22px] tracking-[-.01em] text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{step.desc}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function HomePage() {
  const { t } = useLang();
  useDocumentMeta({
    title: `Recordare · ${t('heroTitle')}`,
    description: t('heroSub'),
    path: '/',
  });

  return (
    <>
      <Hero />
      <Categories />
      <Featured />
      <Process />
    </>
  );
}
