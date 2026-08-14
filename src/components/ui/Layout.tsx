import type { ReactNode } from 'react';

export function Container({
  children,
  className = '',
  wide = true,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full px-5 sm:px-8 ${wide ? 'max-w-[1240px]' : 'max-w-[1000px]'} ${className}`}
    >
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  sub?: string;
  action?: ReactNode;
  as?: 'h1' | 'h2';
}

export function SectionHeader({ title, sub, action, as = 'h2' }: SectionHeaderProps) {
  const Heading = as;
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Heading className="font-serif text-[32px] leading-[1.1] tracking-[-.01em] text-ink sm:text-[38px]">
          {title}
        </Heading>
        {sub && <p className="mt-2 text-[13.5px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
