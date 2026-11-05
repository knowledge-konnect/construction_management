import { Monitor, Moon, Sun } from 'lucide-react';
import type { ThemePreference } from './context';
import { useTheme } from './useTheme';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

/** Three-way theme switch. Rendered as a radio group so it is keyboard- and screen-reader friendly. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div role="radiogroup" aria-label="Theme" className={`inline-flex gap-0.5 rounded-control border border-line bg-sunken p-0.5 ${className}`}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            title={label}
            className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[6px] px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              active ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
