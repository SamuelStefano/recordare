import { useLang } from '../../i18n/lang-context';

// A loja não recebe upload: a foto chega no atendimento. Quem está comprando uma homenagem no
// mesmo mês do enterro precisa ler isso na página da peça, não descobrir depois de pagar.
export function PhotoGuide() {
  const { t } = useLang();
  const tips = [t('photoTip1'), t('photoTip2'), t('photoTip3')];

  return (
    <section className="mt-16 border border-line bg-cream p-7 sm:p-9">
      <h2 className="font-serif text-[26px] tracking-[-.01em] text-ink">{t('photoTitle')}</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-soft">{t('photoIntro')}</p>
      <ul className="mt-5 flex flex-col gap-2.5">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-3 text-[13.5px] leading-relaxed text-muted">
            <span aria-hidden className="text-brand">
              —
            </span>
            {tip}
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-faint">{t('photoLead')}</p>
    </section>
  );
}
