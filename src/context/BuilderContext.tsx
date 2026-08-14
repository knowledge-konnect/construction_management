import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { createEmptyQuotation, DEFAULT_SETTINGS } from '@/lib/defaults';
import type { Quotation } from '@/lib/models';
import { quotationRepo } from '@/lib/storage';
import { calcCommercial, calcValidUntil } from '@/lib/utils';
import { getDocument, nextSequence, saveDocument } from '@/services/document.service';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

interface BuilderContextValue {
  quotation: Quotation | null;
  setQuotation: (updater: (q: Quotation) => Quotation) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: string | null;
  saveNow: () => void;
  isExisting: boolean;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider');
  return ctx;
}

export function BuilderProvider({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const { company } = useCompany();
  const { user } = useAuth();

  const [quotation, setQuotationState] = useState<Quotation | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (loadedRef.current || !company) return;
    loadedRef.current = true;

    const init = async () => {
      if (id) {
        const existing = await getDocument(id, company?.companyId);
        if (existing) {
          setQuotationState(existing);
          setLastSaved(existing.updatedAt);
        } else {
          push('error', 'Quotation not found.');
          navigate('/quotations');
        }
        return;
      }

      // New quotation — use company settings for defaults, but fall back locally
      const settings = company?.settings ?? DEFAULT_SETTINGS;
      const q = createEmptyQuotation();
      const seq = company ? await nextSequence(company.companyId) : await nextSequence('local-company');
      const year = new Date().getFullYear();
      q.quotationNumber = `${settings.prefix}/${year}/${String(seq).padStart(3, '0')}`;
      q.validity = settings.defaultValidity;
      q.validUntil = calcValidUntil(q.quotationDate, q.validity);
      q.customer.state = settings.defaultState;
      q.project.state = settings.defaultState;
      q.tax.name = settings.defaultTaxName;
      q.tax.rate = settings.defaultTaxRate;
      q.terms = settings.defaultTerms.map((t) => ({ ...t, id: uuid() }));
      setQuotationState(q);
    };

    void init();
  }, [id, company, navigate, push]);

  const performSave = useCallback(async (q: Quotation) => {
    const savingCompanyId = company?.companyId ?? 'local-company';
    // Allow saving when a user isn't available (development/local fallback).
    const savingUserId = user?.id ?? 'local';
    setSaveStatus('saving');
    try {
      const commercial = calcCommercial(q);
      const updated: Quotation = {
        ...q,
        subtotal: commercial.boqSubtotal,
        grandTotal: commercial.grandTotal,
        updatedAt: new Date().toISOString(),
      };
      quotationRepo.save({ userId: savingUserId, companyId: savingCompanyId }, updated);
      const result = await saveDocument(updated, savingCompanyId, savingUserId);
      if (result.documentNumber && result.documentNumber !== updated.quotationNumber) {
        // The backend is the source of truth for numbering (atomic
        // allocation via document_sequences) — sync it back so the UI
        // reflects the actual saved number, not just the client-side preview.
        updated.quotationNumber = result.documentNumber;
        setQuotationState((prev) => (prev && prev.id === updated.id ? { ...prev, quotationNumber: result.documentNumber! } : prev));
      }
      setLastSaved(updated.updatedAt);
      setSaveStatus('saved');
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
      push('error', e instanceof Error ? e.message : 'Could not save quotation.');
    }
  }, [company, user, push]);

  const setQuotation = useCallback((updater: (q: Quotation) => Quotation) => {
    setQuotationState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void performSave(next), 1000);
      return next;
    });
  }, [performSave]);

  const saveNow = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (quotation) void performSave(quotation);
  }, [quotation, performSave]);

  return (
    <BuilderContext.Provider value={{ quotation, setQuotation, saveStatus, lastSaved, saveNow, isExisting: !!id }}>
      {children}
    </BuilderContext.Provider>
  );
}
