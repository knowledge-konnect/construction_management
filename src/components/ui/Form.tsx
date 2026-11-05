import { memo, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, required, error, description, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
      </label>
      {description && <p className="mb-1.5 text-[11px] leading-4 text-[var(--text-secondary)]">{description}</p>}
      {children}
      {error && <p className="mt-1 text-[11px] font-medium text-[var(--danger)]">{error}</p>}
    </div>
  );
}

const inputBase =
  'input-shell';

const composeInputClassName = (className?: string) => `${inputBase} ${className || ''}`.trim();

export const TextInput = memo(function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, onChange, type, maxLength, inputMode, ...rest } = props;
  const restrictToDigits = type === 'tel' || inputMode === 'numeric';

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (restrictToDigits) {
      const digitsOnly = event.target.value.replace(/\D/g, '');
      const limit = typeof maxLength === 'number' ? maxLength : 10;
      const nextValue = digitsOnly.slice(0, limit);

      if (nextValue !== event.target.value) {
        event.target.value = nextValue;
      }
    }

    onChange?.(event);
  };

  return (
    <input
      {...rest}
      type={type}
      inputMode={type === 'tel' ? 'numeric' : inputMode}
      maxLength={typeof maxLength === 'number' ? maxLength : restrictToDigits ? 10 : undefined}
      onChange={handleChange}
      className={composeInputClassName(className)}
    />
  );
});

export const Select = memo(function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={`${composeInputClassName(className)} appearance-none`}>
      {children}
    </select>
  );
});

export const TextArea = memo(function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={composeInputClassName(className)} />;
});

export function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  name,
  className = '',
}: {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  className?: string;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)] ${className}`}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] shadow-sm focus:ring-[rgba(36,84,214,0.2)]"
      />
      <span>{label}</span>
    </label>
  );
}

export function Radio({
  label,
  checked,
  defaultChecked,
  onChange,
  name,
  className = '',
}: {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  className?: string;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)] ${className}`}>
      <input
        type="radio"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 border-[var(--border)] text-[var(--primary)] shadow-sm focus:ring-[rgba(36,84,214,0.2)]"
      />
      <span>{label}</span>
    </label>
  );
}

export function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
          {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
