import { supabaseAdmin } from './auth.js';
import { getCompanyById } from './company.js';

export type DocumentType = 'Quotation' | 'BookingReceipt';

/**
 * Confirmed live schema for document_sequences:
 *   id, company_id, document_type, financial_year, prefix, next_number,
 *   created_at, updated_at
 *
 * financial_year is an Indian fiscal year (Apr 1 – Mar 31), stored as the
 * starting calendar year (e.g. a document created in Feb 2027 falls in
 * financial_year 2026, i.e. FY2026-27). prefix is read from the row itself
 * once it exists (set from the company's configured prefix only when the
 * row is first created for that company + document_type + financial_year),
 * NOT re-derived from company_settings on every call — this keeps a
 * financial year's numbering prefix stable even if the company later
 * changes its default prefix mid-year.
 */

function financialYear(date: Date = new Date()): number {
    const month = date.getMonth(); // 0 = Jan
    const year = date.getFullYear();
    return month >= 3 ? year : year - 1; // Apr(3)..Dec -> this year; Jan..Mar -> previous year
}

async function defaultPrefixFor(companyId: string, documentType: DocumentType): Promise<string> {
    const company: any = await getCompanyById(companyId);
    const settingsRow = Array.isArray(company?.company_settings) ? company.company_settings[0] : company?.company_settings;
    if (documentType === 'BookingReceipt') {
        return settingsRow?.booking_prefix || 'BR';
    }
    return settingsRow?.quotation_prefix || 'QTN';
}

function formatNumber(prefix: string, year: number, seq: number): string {
    return `${prefix}/${year}/${String(seq).padStart(3, '0')}`;
}

/**
 * Atomically allocates and PERSISTS the next document number for a
 * company + document type + financial year, using document_sequences.
 * next_number is the number to hand out NEXT: allocating means reading the
 * current value and, in the same compare-and-swap step, writing back
 * next_number + 1 — so two concurrent callers can never receive the same
 * number. There is deliberately NO COUNT(*)-based fallback: if
 * document_sequences can't be read/written, this throws and the caller
 * (POST /api/quotations) surfaces a clean error rather than silently
 * handing out a non-atomic, potentially duplicate number.
 */
export async function allocateDocumentNumber(
    companyId: string,
    documentType: DocumentType,
): Promise<string> {
    const year = financialYear();

    for (let attempt = 0; attempt < 8; attempt++) {
        const { data: existing, error: selectError } = await supabaseAdmin
            .from('document_sequences')
            .select('id, prefix, next_number')
            .eq('company_id', companyId)
            .eq('document_type', documentType)
            .eq('financial_year', year)
            .maybeSingle();

        if (selectError) throw selectError;

        if (!existing) {
            const prefix = await defaultPrefixFor(companyId, documentType);
            // Consume number 1 immediately: the row starts life already
            // pointing at 2 as the next number to hand out.
            const { data: inserted, error: insertError } = await supabaseAdmin
                .from('document_sequences')
                .insert({ company_id: companyId, document_type: documentType, financial_year: year, prefix, next_number: 2 })
                .select('prefix')
                .single();

            if (!insertError && inserted) {
                return formatNumber(inserted.prefix, year, 1);
            }
            // Most likely a concurrent request just inserted the same row
            // first (unique company_id+document_type+financial_year) —
            // loop and pick it up via the update branch below.
            continue;
        }

        const assigned = existing.next_number;
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('document_sequences')
            .update({ next_number: assigned + 1 })
            .eq('id', existing.id)
            .eq('next_number', assigned) // compare-and-swap guard
            .select('prefix, next_number')
            .maybeSingle();

        if (updateError) throw updateError;
        if (updated) {
            return formatNumber(existing.prefix, year, assigned);
        }
        // Someone else updated between our SELECT and UPDATE — retry.
    }

    throw new Error('Could not allocate a document number after several attempts (high contention).');
}

/**
 * Non-mutating preview of the next number, for UI display before a document
 * actually exists. Does NOT reserve/consume next_number — the real,
 * race-free allocation happens in allocateDocumentNumber when the document
 * is first saved, so an abandoned draft never creates a numbering gap and
 * two concurrent previews never collide.
 */
export async function peekNextDocumentNumber(
    companyId: string,
    documentType: DocumentType,
): Promise<string> {
    const year = financialYear();

    const { data, error } = await supabaseAdmin
        .from('document_sequences')
        .select('prefix, next_number')
        .eq('company_id', companyId)
        .eq('document_type', documentType)
        .eq('financial_year', year)
        .maybeSingle();

    if (error) throw error;

    if (data) {
        return formatNumber(data.prefix, year, data.next_number);
    }

    const prefix = await defaultPrefixFor(companyId, documentType);
    return formatNumber(prefix, year, 1);
}
