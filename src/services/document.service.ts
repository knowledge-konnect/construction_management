/**
 * Document (quotation) service — talks to the Fastify backend
 * (/api/quotations/*) exclusively. There is no direct Supabase fallback here
 * anymore: business/company data must always go through the authorized
 * backend (see server/src/index.ts + server/src/authz.ts), never straight
 * from the browser with the anon key.
 *
 * localStorage is used ONLY as a client-side recovery/autosave cache — it
 * is written on every successful save and read only if the backend request
 * itself fails (offline, network error, server down), never as a silent
 * substitute data source when the user is simply not the owner of something.
 * Keys are scoped per user + company (see src/lib/storage.ts) so one
 * person's cached drafts never leak into another person's session on a
 * shared browser.
 */
import { getCurrentUserIdFromToken } from '@/services/auth.service';
import { defaultQuestionnaire } from '@/lib/defaults';
import type { Quotation, Term } from '@/lib/models';
import { quotationRepo } from '@/lib/storage';
import { apiDelete, apiGet, apiPost } from '@/services/apiClient';

function currentStorageScope(companyId: string) {
    return { userId: getCurrentUserIdFromToken() ?? 'anonymous', companyId };
}

function parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    return 0;
}

function parseTerms(value: unknown): Term[] {
    if (!value) return [];
    try {
        if (Array.isArray(value)) {
            return value.map((item, index) => ({
                id: (item as any)?.id ?? `default-term-${index}`,
                text: String((item as any)?.text ?? item ?? ''),
                displayOrder: Number((item as any)?.displayOrder ?? index),
            }));
        }
        if (typeof value === 'string') {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed)
                ? parsed.map((item, index) => ({
                    id: (item as any)?.id ?? `default-term-${index}`,
                    text: String((item as any)?.text ?? item ?? ''),
                    displayOrder: Number((item as any)?.displayOrder ?? index),
                }))
                : [];
        }
    } catch {
        return [];
    }
    return [];
}

function mapStatusToDb(status: Quotation['status']): string {
    return status === 'DRAFT' ? 'Draft' : 'Completed';
}

function mapStatusFromDb(status: string): Quotation['status'] {
    return status === 'Draft' ? 'DRAFT' : 'GENERATED';
}

function parseDocumentRow(row: any): Quotation | null {
    if (!row) return null;

    const customerData = row.customers ?? null;
    const customer = {
        name: customerData?.name ?? '',
        mobile: customerData?.mobile ?? '',
        email: customerData?.email ?? '',
        address: customerData?.address ?? '',
        city: '',
        state: 'Andhra Pradesh',
        pincode: '',
    };

    const boqSections = Array.isArray(row.document_sections)
        ? row.document_sections.map((section: any) => ({
            id: section.id,
            title: section.section_name ?? '',
            displayOrder: section.display_order ?? 0,
            items: Array.isArray(section.document_items)
                ? section.document_items.map((item: any) => ({
                    id: item.id,
                    description: item.description ?? '',
                    quantity: parseNumber(item.quantity),
                    unit: item.unit ?? '',
                    rate: parseNumber(item.rate),
                    amount: parseNumber(item.amount),
                    displayOrder: item.display_order ?? 0,
                }))
                : [],
        }))
        : [];

    return {
        id: row.id,
        quotationNumber: row.document_number ?? '',
        status: mapStatusFromDb(row.status ?? ''),
        quotationDate: row.quotation_date ? String(row.quotation_date) : '',
        validUntil: row.valid_until ? String(row.valid_until) : '',
        validity: '30 Days',
        customer,
        project: {
            name: row.project_name ?? '',
            projectType: row.project_type ?? '',
            builtupArea: String(row.builtup_area ?? ''),
            builtupAreaUnit: row.area_unit ?? '',
            floors: row.floors ?? '',
            address: row.project_location ?? '',
            city: '',
            state: '',
        },
        questionnaire: defaultQuestionnaire(),
        boqSections,
        specifications: Array.isArray(row.document_specifications)
            ? row.document_specifications.map((spec: any) => ({
                id: spec.id,
                title: spec.specification_type ?? '',
                description: spec.description ?? '',
                displayOrder: spec.display_order ?? 0,
            }))
            : [],
        inclusions: Array.isArray(row.document_inclusions) ? row.document_inclusions.map((item: any) => item.description ?? '') : [],
        exclusions: Array.isArray(row.document_exclusions) ? row.document_exclusions.map((item: any) => item.description ?? '') : [],
        additionalCharges:
            parseNumber(row.additional_charges) > 0
                ? [
                    {
                        id: 'additional-1',
                        description: 'Additional charges',
                        amount: parseNumber(row.additional_charges),
                    },
                ]
                : [],
        discount: {
            type: parseNumber(row.discount) > 0 ? 'Fixed Amount' : 'None',
            value: parseNumber(row.discount),
        },
        tax: {
            applicable: parseNumber(row.tax_percentage) > 0,
            name: 'GST',
            rate: parseNumber(row.tax_percentage),
        },
        paymentSchedule: Array.isArray(row.payment_schedules)
            ? row.payment_schedules.map((schedule: any) => ({
                id: schedule.id,
                name: schedule.stage_name ?? '',
                percentage: parseNumber(schedule.percentage),
                notes: '',
                amount: parseNumber(schedule.amount),
                displayOrder: schedule.display_order ?? 0,
            }))
            : [],
        terms: Array.isArray(row.document_terms)
            ? row.document_terms.map((term: any) => ({
                id: term.id,
                text: term.description ?? '',
                displayOrder: term.display_order ?? 0,
            }))
            : [],
        customerNotes: row.notes ?? '',
        internalNotes: '',
        subtotal: parseNumber(row.subtotal),
        grandTotal: parseNumber(row.grand_total),
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
        generatedAt: null,
    };
}

export async function listDocuments(companyId: string): Promise<Quotation[]> {
    const { data, error } = await apiGet<{ quotations: any[] }>('/api/quotations');
    if (!error && Array.isArray(data?.quotations)) {
        return data!.quotations.map(parseDocumentRow).filter(Boolean) as Quotation[];
    }

    console.warn('Failed to load documents from the server, showing locally cached drafts', error);
    return quotationRepo.list(currentStorageScope(companyId));
}

export async function getDocument(id: string, companyId?: string): Promise<Quotation | null> {
    const { data, error } = await apiGet<{ quotation: any }>(`/api/quotations/${id}`);
    if (!error && data?.quotation) {
        return parseDocumentRow(data.quotation);
    }

    console.warn('Failed to load document from the server, checking locally cached drafts', error);
    if (!companyId) return null;
    return quotationRepo.get(currentStorageScope(companyId), id);
}

export interface SaveDocumentResult {
    ok: boolean;
    documentNumber?: string;
}

export async function saveDocument(quotation: Quotation, companyId: string, userId: string): Promise<SaveDocumentResult> {
    // Always cache the draft locally first — if the network request below
    // fails, the user's edits aren't lost and can be recovered on retry.
    quotationRepo.save(currentStorageScope(companyId), quotation);

    const { data, error } = await apiPost<{ ok: boolean; id: string; documentNumber?: string }>('/api/quotations', {
        quotation,
        companyId,
    });

    if (error || !data?.ok) {
        console.warn('Failed to save document to the server; it remains cached locally until the next successful save', error);
        return { ok: false };
    }

    return { ok: true, documentNumber: data.documentNumber };
}

export async function deleteDocument(id: string, companyId?: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>('/api/quotations/' + id);
    if (!error) {
        if (companyId) quotationRepo.delete(currentStorageScope(companyId), id);
        return true;
    }

    console.warn('Failed to delete document on the server', error);
    return false;
}

export async function nextSequence(companyId: string): Promise<number> {
    const { data, error } = await apiGet<{ nextSequence: number }>(`/api/quotations/next-sequence?companyId=${encodeURIComponent(companyId)}`);
    if (!error && typeof data?.nextSequence === 'number') {
        return data.nextSequence;
    }

    console.warn('Failed to get sequence from the server, falling back to a local counter', error);
    return quotationRepo.nextSequence(currentStorageScope(companyId));
}
