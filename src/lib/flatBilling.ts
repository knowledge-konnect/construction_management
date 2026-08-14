// Flat Billing / Booking Receipt domain model and storage.

import { STORAGE_KEYS } from './constants';
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

const KEY = STORAGE_KEYS.flatBillings;

export const flatBillingRepo = {
  list(): FlatBilling[] {
    return safeParse<FlatBilling[]>(KEY, []);
  },
  get(id: string): FlatBilling | null {
    return this.list().find((b) => b.id === id) ?? null;
  },
  save(b: FlatBilling): void {
    const all = this.list();
    const idx = all.findIndex((x) => x.id === b.id);
    if (idx >= 0) all[idx] = b;
    else all.push(b);
    safeWrite(KEY, all);
  },
  delete(id: string): void {
    safeWrite(KEY, this.list().filter((b) => b.id !== id));
  },
  nextSequence(): number {
    const seqKey = STORAGE_KEYS.flatBillingSequence;
    const seq = safeParse<number>(seqKey, 0);
    const next = seq + 1;
    safeWrite(seqKey, next);
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
