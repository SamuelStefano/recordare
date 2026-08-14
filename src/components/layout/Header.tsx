import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useLang } from '../../i18n/lang-context';
import { useCart } from '../../cart/cart-context';
import { LANGS } from '../../lib/i18n';
import { Container } from '../ui/Layout';

function BrandMark() {
  const { t } = useLang();
  return (
    <Link href="/" className="flex flex-col leading-none">
      <span className="font-serif text-[25px] tracking-[-.01em] text-ink">Recordare</span>
      <span className="text-[9.5px] font-semibold tracking-[.32em] text-brand uppercase">
        {t('brandTagline')}
      </span>
    </Link>
  );
}

function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t('langLabel')}
      className="flex items-center rounded-full border border-line-deep"
    >
      {LANGS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`h-7 rounded-full px-3 text-[10.5px] font-semibold tracking-[.14em] uppercase transition-colors duration-200 ${
            lang === option ? 'bg-brand text-white' : 'text-muted hover:text-brand'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function CartLink() {
  const { t } = useLang();
  const { count } = useCart();
  return (
    <Link
      href="/carrinho"
      className="relative inline-flex size-10 items-center justify-center rounded-full border border-line-deep text-ink transition-colors duration-200 hover:border-brand hover:text-brand"
      aria-label={`${t('cartAria')} — ${count} ${t('cartItemsAria')}`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 5h2l2.2 10.4a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.55L20.5 8H6" />
        <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const { t } = useLang();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [location]);

  // Esc fecha o menu: quem abriu no teclado precisa de uma saída que não seja caçar o botão.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      // O foco está dentro do menu que vai sumir; sem devolvê-lo o teclado recomeça do topo.
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const links = [
    { href: '/', label: t('navHome') },
    { href: '/catalogo', label: t('navCatalog') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[rgba(247,243,236,.92)] backdrop-blur-[10px]">
      <Container className="flex h-[74px] items-center justify-between gap-6">
        <div className="flex items-center gap-9">
          <BrandMark />
          <nav aria-label={t('navMain')} className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] tracking-[.02em] transition-colors duration-200 hover:text-brand ${
                  location === link.href ? 'text-brand' : 'text-ink-soft'
                }`}
                aria-current={location === link.href ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LangToggle />
          </div>
          <CartLink />
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? t('closeMenu') : t('openMenu')}
            className="inline-flex size-10 items-center justify-center rounded-full border border-line-deep text-ink md:hidden"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </Container>

      {open && (
        <nav id="menu-mobile" aria-label={t('navMain')} className="border-t border-line bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2.5 text-[15px] text-ink-soft hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 sm:hidden">
              <LangToggle />
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}
