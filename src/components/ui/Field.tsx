import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const CONTROL =
  'w-full rounded-[2px] border bg-cream px-3.5 text-[13.5px] text-ink placeholder:text-faint ' +
  'transition-colors duration-200 focus:border-brand focus:outline-none';

function Shell({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold tracking-[.14em] text-muted uppercase">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[12px] text-faint">{hint}</p>}
      {/* role=alert faz o leitor de tela anunciar o erro no momento em que ele aparece,
          em vez de o usuário descobrir só ao tabular de volta pelo formulário. */}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[12px] text-brand-dark">
          {error}
        </p>
      )}
    </div>
  );
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
}

export function Field({ label, error, hint, className = '', ...props }: FieldProps) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} h-11 ${error ? 'border-brand-dark' : 'border-line-deep'} ${className}`}
        {...props}
      />
    </Shell>
  );
}

interface TextFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextArea({ label, error, hint, className = '', ...props }: TextFieldProps) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} min-h-28 resize-y py-3 ${error ? 'border-brand-dark' : 'border-line-deep'} ${className}`}
        {...props}
      />
    </Shell>
  );
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  const id = useId();
  return (
    <Shell id={id} label={label}>
      <select
        id={id}
        className={`${CONTROL} h-11 border-line-deep ${className}`}
        {...props}
      >
        {children}
      </select>
    </Shell>
  );
}
