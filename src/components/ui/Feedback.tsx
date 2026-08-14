import type { ReactNode } from 'react';
import { useLang } from '../../i18n/lang-context';
import { Button } from './Button';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[3px] bg-sand ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  const { t } = useLang();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('loading')}
      className="grid grid-cols-2 gap-5 lg:grid-cols-3 lg:gap-[22px]"
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
  /** `h1` quando o estado vazio É a página (404, carrinho vazio), senão `h2`. */
  as?: 'h1' | 'h2';
}

export function EmptyState({ title, body, action, as: Heading = 'h2' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 border border-line px-6 py-16 text-center">
      <Heading className="font-serif text-[26px] tracking-[-.01em] text-ink">{title}</Heading>
      <p className="max-w-md text-[13.5px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang();
  return (
    <div role="alert">
      <EmptyState
        title={t('errorTitle')}
        body={t('errorBody')}
        action={<Button onClick={onRetry}>{t('retry')}</Button>}
      />
    </div>
  );
}
