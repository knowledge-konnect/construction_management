/**
 * Flat Billing (booking receipt) service — talks to the Fastify backend
 * (/api/flat-billings/*) exclusively, mirroring document.service.ts's
 * pattern exactly. There is no direct Supabase access here.
 *
 * localStorage (flatBillingRepo, see src/lib/flatBilling.ts) is used ONLY as
 * a client-side recovery/autosave cache — written on every successful save,
 * read only if the backend request itself fails. Supabase/the backend
 * remains the source of truth.
 */
import { getCurrentUserIdFromToken } from '@/services/auth.service';
import type { FlatBilling, FlatPaymentRow } from '@/lib/flatBilling';
import { flatBillingRepo } from '@/lib/flatBilling';
import { apiDelete, apiGet, apiPost } from '@/services/apiClient';

function currentStorageScope(companyId: string) {
  return { userId: getCurrentUserIdFromToken() ?? 'anonymous', companyId };
}

function pickSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return (value as T) ?? null;
}

function parseFlatBillingRow(row: any): FlatBilling {
  const customer = pickSingle<any>(row.customers);
  const details = pickSingle<any>(row.booking_receipt_details);

  const payments: FlatPaymentRow[] = (row.payment_schedules ?? [])
    .slice()
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((p: any) => ({
      id: p.id,
      stage: p.stage_name ?? '',
      amount: Number(p.amount ?? 0),
      dueDate: p.due_date ?? '',
      status: p.status ?? 'Pending',
    }));

  const terms: string[] = (row.document_terms ?? [])
    .slice()
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((t: any) => t.description ?? '');

  return {
    id: row.id,
    receiptNumber: row.document_number ?? '',
    bookingId: details?.booking_id ?? '',
    date: row.quotation_date ?? '',
    buyerName: customer?.name ?? '',
    buyerAddress: customer?.address ?? '',
    buyerPhone: customer?.mobile ?? '',
    buyerPanAadhar: details?.buyer_pan_aadhar ?? '',
    flatNo: details?.flat_no ?? '',
    floor: details?.floor ?? '',
    blockTower: details?.block_tower ?? '',
    areaSqft: row.builtup_area !== null && row.builtup_area !== undefined ? String(row.builtup_area) : '',
    ratePerSqft: details?.rate_per_sqft !== null && details?.rate_per_sqft !== undefined ? String(details.rate_per_sqft) : '',
    payments,
    terms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFlatBillings(companyId: string): Promise<FlatBilling[]> {
  const { data, error } = await apiGet<{ flatBillings: any[] }>('/api/flat-billings');
  if (!error && Array.isArray(data?.flatBillings)) {
    return data!.flatBillings.map(parseFlatBillingRow);
  }

  console.warn('Failed to load receipts from the server, showing locally cached drafts', error);
  return flatBillingRepo.list(currentStorageScope(companyId));
}

export async function getFlatBilling(id: string, companyId?: string): Promise<FlatBilling | null> {
  const { data, error } = await apiGet<{ flatBilling: any }>(`/api/flat-billings/${id}`);
  if (!error && data?.flatBilling) {
    return parseFlatBillingRow(data.flatBilling);
  }

  console.warn('Failed to load receipt from the server, checking locally cached drafts', error);
  if (!companyId) return null;
  return flatBillingRepo.get(currentStorageScope(companyId), id);
}

export interface SaveFlatBillingResult {
  ok: boolean;
  receiptNumber?: string;
}

export async function saveFlatBilling(billing: FlatBilling, companyId: string, _userId: string): Promise<SaveFlatBillingResult> {
  // Always cache the draft locally first — if the network request below
  // fails, the user's edits aren't lost and can be recovered on retry.
  flatBillingRepo.save(currentStorageScope(companyId), billing);

  const { data, error } = await apiPost<{ ok: boolean; id: string; receiptNumber?: string }>('/api/flat-billings', {
    flatBilling: billing,
    companyId,
  });

  if (error || !data?.ok) {
    console.warn('Failed to save receipt to the server; it remains cached locally until the next successful save', error);
    return { ok: false };
  }

  return { ok: true, receiptNumber: data.receiptNumber };
}

export async function deleteFlatBilling(id: string, companyId?: string): Promise<boolean> {
  const { error } = await apiDelete<{ ok: boolean }>('/api/flat-billings/' + id);
  if (!error) {
    if (companyId) flatBillingRepo.delete(currentStorageScope(companyId), id);
    return true;
  }

  console.warn('Failed to delete receipt on the server', error);
  return false;
}

export async function nextFlatBillingSequence(companyId: string): Promise<number> {
  const { data, error } = await apiGet<{ nextSequence: number }>(`/api/flat-billings/next-sequence?companyId=${encodeURIComponent(companyId)}`);
  if (!error && typeof data?.nextSequence === 'number') {
    return data.nextSequence;
  }

  console.warn('Failed to get sequence from the server, falling back to a local counter', error);
  return flatBillingRepo.nextSequence(currentStorageScope(companyId));
}
