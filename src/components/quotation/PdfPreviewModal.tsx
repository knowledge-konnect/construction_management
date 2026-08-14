import type { CompanySettings, Quotation } from '@/lib/models';
import { buildQuotationPDFBlob, quotationPdfFilename } from '@/lib/pdf';
import { AlertTriangle, Download, Loader2, Mail, MessageCircle, X } from 'lucide-react';
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
        setError(e instanceof Error ? e.message : 'Could not generate PDF preview.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">PDF Preview — {quotation.quotationNumber}</h3>
            <p className="text-xs text-slate-500 truncate">{filename}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex-shrink-0" aria-label="Close preview">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-[50vh] bg-slate-100 overflow-hidden">
          {error && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-4 text-sm max-w-md">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            </div>
          )}
          {!error && !blobUrl && (
            <div className="h-full flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {!error && blobUrl && (
            <iframe title="Quotation PDF preview" src={blobUrl} className="w-full h-full min-h-[60vh] border-0" />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-slate-200">
          <a
            href={blobUrl ? whatsappHref : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border ${blobUrl ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50' : 'text-slate-400 border-slate-200 cursor-not-allowed'}`}
            onClick={(e) => {
              if (!blobUrl) e.preventDefault();
            }}
            aria-disabled={!blobUrl}
          >
            <MessageCircle className="w-4 h-4" /> Share on WhatsApp
          </a>
          <a
            href={blobUrl ? mailtoHref : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border ${blobUrl ? 'text-blue-700 border-blue-300 hover:bg-blue-50' : 'text-slate-400 border-slate-200 cursor-not-allowed'}`}
            onClick={(e) => {
              if (!blobUrl) e.preventDefault();
            }}
            aria-disabled={!blobUrl}
          >
            <Mail className="w-4 h-4" /> Email
          </a>
          <button
            onClick={handleDownload}
            disabled={!blobUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] disabled:opacity-50 rounded-lg"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
