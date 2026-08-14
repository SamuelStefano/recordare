import type { ButtonHTMLAttributes } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected = false, className = '', ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex h-8 items-center rounded-full border px-3.5 text-[12.5px] transition-colors duration-200 ${
        selected
          ? 'border-brand bg-brand text-white'
          : 'border-line-deep bg-transparent text-muted hover:border-brand hover:text-brand'
      } ${className}`}
      {...props}
    />
  );
}

interface SwatchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  color: string;
  label: string;
}

export function Swatch({ selected = false, color, label, className = '', ...props }: SwatchProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className={`size-8 rounded-full border-2 transition-colors duration-200 ${
        selected ? 'border-brand' : 'border-line-deep hover:border-faint'
      } ${className}`}
      style={{ backgroundColor: color }}
      {...props}
    />
  );
}
