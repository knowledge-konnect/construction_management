import { DocumentGenerationLoader } from '@/components/loading/Loaders';
import type { CompanySettings, Quotation } from '@/lib/models';
import { buildQuotationPDFBlob, quotationPdfFilename } from '@/lib/pdf';
import { AlertTriangle, Download, Mail, MessageCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
  quotation: Quotation;
  settings: CompanySettings;
  onClose: () => void;
}

export default function PdfPreviewModal({ quotation, settings, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filename = useMemo(() => quotationPdfFilename(quotation), [quotation]);
  const generating = !error && !blobUrl;

  useEffect(() => {
    let url: string | null = null;
    let active = true;
    setBlobUrl(null);
    setError(null);

    buildQuotationPDFBlob(quotation, settings)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch((e) => {
        if (!active) return;
        setError('We could not generate the PDF preview right now. Please try again.');
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [quotation, settings]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  const whatsappHref = useMemo(() => {
    const mobile = quotation.customer.mobile ? quotation.customer.mobile.replace(/\D/g, '') : '';
    const text = encodeURIComponent(
      `Hi ${quotation.customer.name || ''}, please find the quotation ${quotation.quotationNumber} from ${settings.companyName || 'us'} attached. Since WhatsApp links can't attach files directly, we'll send the PDF separately — just confirming this chat is open.`,
    );
    // If we have a 10-digit Indian mobile, prefill the chat with that number; otherwise open the share sheet.
    const number = mobile.length === 10 ? `91${mobile}` : mobile;
    return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
  }, [quotation, settings]);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`Quotation ${quotation.quotationNumber} — ${settings.companyName || ''}`);
    const body = encodeURIComponent(
      `Hi ${quotation.customer.name || ''},\n\nPlease find attached the quotation ${quotation.quotationNumber} for ${quotation.project.name || 'your project'}.\n\nThe PDF has been downloaded to your device — please attach it to this email before sending.\n\nRegards,\n${settings.contactPerson || settings.companyName || ''}`,
    );
    return `mailto:${quotation.customer.email || ''}?subject=${subject}&body=${body}`;
  }, [quotation, settings]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17243A]/50 p-3 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PDF preview"
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-3xl flex-col rounded-2xl border border-[var(--border)] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[var(--text)]">PDF Preview — {quotation.quotationNumber}</h3>
            <p className="truncate text-xs text-[var(--text-muted)]">{filename}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]" aria-label="Close preview">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-[50vh] flex-1 bg-[var(--surface-muted)]">
          {error && (
            <div className="flex h-full items-center justify-center p-6">
              <div className="flex max-w-md items-start gap-2 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger-fg)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
              </div>
            </div>
          )}
          {!error && !blobUrl && (
            <div className="flex h-full items-center justify-center p-6">
              <DocumentGenerationLoader label="Generating PDF preview…" />
            </div>
          )}
          {!error && blobUrl && (
            <iframe title="Quotation PDF preview" src={blobUrl} className="h-[60vh] w-full border-0" />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <a
            href={blobUrl ? whatsappHref : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${blobUrl ? 'border-[#0F766E]/30 text-[var(--success)] hover:bg-[var(--success-soft)]' : 'cursor-not-allowed border-[var(--border)] text-slate-400'}`}
            onClick={(e) => {
              if (!blobUrl) e.preventDefault();
            }}
            aria-disabled={!blobUrl}
          >
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </a>
          <a
            href={blobUrl ? mailtoHref : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${blobUrl ? 'border-[#1D4ED8]/30 text-[var(--primary)] hover:bg-[var(--primary-soft)]' : 'cursor-not-allowed border-[var(--border)] text-slate-400'}`}
            onClick={(e) => {
              if (!blobUrl) e.preventDefault();
            }}
            aria-disabled={!blobUrl}
          >
            <Mail className="h-4 w-4" /> Email
          </a>
          <button
            onClick={handleDownload}
            disabled={!blobUrl || generating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
