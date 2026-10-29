import { memo, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, required, error, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[#344054] mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputBase =
  'w-full px-3 py-2 text-sm border border-[#D0D5DD] rounded-lg bg-white text-[#17243A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25 focus:border-[#1D4ED8] disabled:bg-slate-50';

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
    <select {...rest} className={composeInputClassName(className)}>
      {children}
    </select>
  );
});

export const TextArea = memo(function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={composeInputClassName(className)} />;
});

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
    <div className="bg-white border border-[#E6E8EC] rounded-2xl shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-5 py-4 border-b border-[#E6E8EC]">
        <div>
          <h3 className="text-base font-semibold text-[#17243A]">{title}</h3>
          {description && (
            <p className="text-sm text-[#667085] mt-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
