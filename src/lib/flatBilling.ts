// Flat Billing / Booking Receipt domain model and storage.

import type { StorageScope } from './storage';
import type { CompanySettings } from './models';

export interface FlatPaymentRow {
  id: string;
  stage: string;
  amount: number;
  dueDate: string;
  status: string;
}

export interface FlatBilling {
  id: string;
  receiptNumber: string;
  bookingId: string;
  date: string;

  // Buyer
  buyerName: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerPanAadhar: string;

  // Flat details
  flatNo: string;
  floor: string;
  blockTower: string;
  areaSqft: string;
  ratePerSqft: string;

  // Payment schedule
  payments: FlatPaymentRow[];

  // Terms
  terms: string[];

  createdAt: string;
  updatedAt: string;
}

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    const msg =
      e instanceof DOMException && e.name === 'QuotaExceededError'
        ? 'Storage quota exceeded.'
        : 'Could not save data to this browser.';
    throw new Error(msg);
  }
}

// Local drafts/receipts are a per-user, per-company store — there is no
// backend for Flat Billing yet (see the V1 audit notes), so these keys being
// correctly scoped is the ONLY thing preventing one company's booking
// receipts from appearing for another company signed into the same browser.
function billingKey(scope: StorageScope, id: string): string {
  return `sopan.flatBilling.${scope.userId}.${scope.companyId}.${id}`;
}

function billingIndexKey(scope: StorageScope): string {
  return `sopan.flatBilling_index.${scope.userId}.${scope.companyId}`;
}

function billingSequenceKey(scope: StorageScope): string {
  return `sopan.flatBillingSequence.${scope.userId}.${scope.companyId}`;
}

export const flatBillingRepo = {
  list(scope: StorageScope): FlatBilling[] {
    const ids = safeParse<string[]>(billingIndexKey(scope), []);
    const records: FlatBilling[] = [];
    for (const id of ids) {
      const b = safeParse<FlatBilling | null>(billingKey(scope, id), null);
      if (b) records.push(b);
    }
    return records;
  },
  get(scope: StorageScope, id: string): FlatBilling | null {
    return safeParse<FlatBilling | null>(billingKey(scope, id), null);
  },
  save(scope: StorageScope, b: FlatBilling): void {
    safeWrite(billingKey(scope, b.id), b);
    const ids = safeParse<string[]>(billingIndexKey(scope), []);
    if (!ids.includes(b.id)) {
      safeWrite(billingIndexKey(scope), [...ids, b.id]);
    }
  },
  delete(scope: StorageScope, id: string): void {
    try {
      localStorage.removeItem(billingKey(scope, id));
    } catch {
      // best-effort — nothing to recover from a removeItem failure
    }
    const ids = safeParse<string[]>(billingIndexKey(scope), []);
    safeWrite(billingIndexKey(scope), ids.filter((x) => x !== id));
  },
  nextSequence(scope: StorageScope): number {
    const seq = safeParse<number>(billingSequenceKey(scope), 0);
    const next = seq + 1;
    safeWrite(billingSequenceKey(scope), next);
    return next;
  },
};

export function defaultFlatBilling(): Omit<FlatBilling, 'id' | 'receiptNumber' | 'createdAt' | 'updatedAt'> {
  return {
    bookingId: '',
    date: new Date().toISOString().slice(0, 10),
    buyerName: '',
    buyerAddress: '',
    buyerPhone: '',
    buyerPanAadhar: '',
    flatNo: '',
    floor: '',
    blockTower: '',
    areaSqft: '',
    ratePerSqft: '',
    payments: [
      { id: '1', stage: 'Booking Advance', amount: 0, dueDate: '', status: 'Pending' },
      { id: '2', stage: 'Agreement Registration', amount: 0, dueDate: '', status: 'Pending' },
      { id: '3', stage: 'Construction Phase 1', amount: 0, dueDate: '', status: 'Pending' },
      { id: '4', stage: 'Possession', amount: 0, dueDate: '', status: 'Pending' },
    ],
    terms: [
      'Booking advance is non-refundable.',
      'Possession will be given on completion of project.',
      'Delayed payments will incur interest charges.',
      'All disputes are subject to local jurisdiction.',
    ],
  };
}

export function calcFlatTotal(b: Pick<FlatBilling, 'areaSqft' | 'ratePerSqft'>): number {
  const area = parseFloat(b.areaSqft) || 0;
  const rate = parseFloat(b.ratePerSqft) || 0;
  return Math.round(area * rate * 100) / 100;
}

export function generateFlatBillingPDF(billing: FlatBilling, settings: CompanySettings): void {
  import('./flatBillingPdf').then(({ generateFlatBillingPDFImpl }) => {
    generateFlatBillingPDFImpl(billing, settings);
  });
}
