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

