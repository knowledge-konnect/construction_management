<<<<<<< HEAD
import { AlertTriangle } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
=======
import { type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
>>>>>>> origin/main

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
<<<<<<< HEAD
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#17243A]/50"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E6E8EC] bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
              }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="text-base font-semibold text-[#17243A]">{title}</h3>
            <div className="mt-1 text-sm text-[#5B6475]">{message}</div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#E6E8EC] bg-white px-4 py-2.5 text-sm font-medium text-[#17243A] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40"
=======
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <div className="mt-1 text-sm text-slate-600">{message}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
>>>>>>> origin/main
          >
            {cancelLabel}
          </button>
          <button
<<<<<<< HEAD
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 ${danger
              ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-400'
              : 'bg-[#1D4ED8] hover:bg-[#1E40AF] focus-visible:ring-[#1D4ED8]/40'
              }`}
=======
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 ${
              danger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400'
                : 'bg-[#0B2857] hover:bg-[#071C3F] focus:ring-[#0B2857]/50'
            }`}
>>>>>>> origin/main
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
