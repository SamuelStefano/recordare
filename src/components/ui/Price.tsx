import { money } from '../../lib/format';
import { useLang } from '../../i18n/lang-context';

interface PriceProps {
  value: number;
  unit?: 'un' | 'm2';
  className?: string;
}

export function Price({ value, unit = 'un', className = '' }: PriceProps) {
  const { t } = useLang();
  return (
    <span className={className}>
      {money(value)}
      {unit === 'm2' && <span className="text-[.72em] text-muted">{t('unitM2')}</span>}
    </span>
  );
}

export function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
      <span aria-hidden className="text-star">
        ★
      </span>
      <span>{rating.toFixed(1)}</span>
      <span className="text-faint">({reviews})</span>
    </span>
  );
}
