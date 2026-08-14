import { Link } from 'wouter';
import { useLang } from '../../i18n/lang-context';
import { CATEGORIES, categoryLabel } from '../../lib/labels';
import { Container } from '../ui/Layout';

export function AnnouncementBar() {
  const { t } = useLang();
  return (
    <div className="bg-night text-onnight">
      <Container className="py-2.5 text-center text-[11px] tracking-[.14em] uppercase">
        {t('ann')}
      </Container>
    </div>
  );
}

export function Footer() {
  const { lang, t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-night text-onnight">
      <Container className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:gap-10">
        <div>
          <span className="font-serif text-[25px] tracking-[-.01em]">Recordare</span>
          <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-night-dim">{t('footTag')}</p>
        </div>

        <nav aria-labelledby="foot-shop">
          <h2 id="foot-shop" className="text-[10.5px] font-semibold tracking-[.22em] uppercase">
            {t('footShop')}
          </h2>
          <ul className="mt-4 flex flex-col gap-1">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link
                  href={`/catalogo?cat=${cat}`}
                  className="inline-flex min-h-6 items-center text-[13.5px] text-night-dim transition-colors duration-200 hover:text-onnight"
                >
                  {categoryLabel(cat, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="foot-help">
          <h2 id="foot-help" className="text-[10.5px] font-semibold tracking-[.22em] uppercase">
            {t('footHelp')}
          </h2>
          <ul className="mt-4 flex flex-col gap-1">
            <li>
              <Link
                href="/catalogo"
                className="inline-flex min-h-6 items-center text-[13.5px] text-night-dim transition-colors duration-200 hover:text-onnight"
              >
                {t('navCatalog')}
              </Link>
            </li>
            <li>
              <Link
                href="/carrinho"
                className="inline-flex min-h-6 items-center text-[13.5px] text-night-dim transition-colors duration-200 hover:text-onnight"
              >
                {t('cartTitle')}
              </Link>
            </li>
            <li className="text-[13.5px] text-night-dim">{t('mlBadge')}</li>
          </ul>
        </nav>
      </Container>

      <div className="border-t border-night-line">
        <Container className="py-6 text-[12px] text-night-dim">
          © {year} Recordare · {t('footRights')}
        </Container>
      </div>
    </footer>
  );
}
