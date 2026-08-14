import type { ReactNode } from 'react';

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-1 text-[9.5px] font-semibold tracking-[.14em] text-white uppercase">
      {children}
    </span>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`block text-[9.5px] font-semibold tracking-[.32em] text-brand uppercase ${className}`}
    >
      {children}
    </span>
  );
}
