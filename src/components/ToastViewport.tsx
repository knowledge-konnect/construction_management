import { useToast } from '@/context/ToastContext';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const kindStyles: Record<string, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

const kindIcons: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = kindIcons[t.kind];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 border rounded-lg shadow-md px-4 py-3 text-sm ${kindStyles[t.kind]} animate-in slide-in-from-top-2`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-current/70 hover:text-current"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
