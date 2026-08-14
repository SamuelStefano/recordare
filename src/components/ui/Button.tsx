import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'wouter';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'night';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-[2px] font-medium tracking-[.02em] ' +
  'transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  outline: 'border border-line-deep bg-transparent text-ink hover:border-brand hover:text-brand',
  ghost: 'bg-transparent text-muted hover:text-brand',
  night: 'bg-cream text-night hover:bg-onnight',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[12.5px]',
  md: 'h-11 px-6 text-[13.5px]',
  lg: 'h-[52px] px-8 text-[14px]',
};

function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant, size, className = '', ...props }: ButtonProps) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ href, variant, size, className = '', children }: ButtonLinkProps) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}
