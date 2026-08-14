import { DEFAULT_SETTINGS } from '@/lib/defaults';
import type { CompanySettings } from '@/lib/models';
import { apiRequest } from '@/services/apiClient';

export interface CompanyRecord {
    companyId: string;
    ownerId: string;
    settings: CompanySettings;
}

// ─── API helper ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
    const { data, error, status } = await apiRequest<T>(path, init);
    if (error) {
        console.warn(`API ${path} failed (${status ?? 'network error'}):`, error);
        return null;
    }
    return data ?? null;
}

// ─── Mapping helpers ───────────────────────────────────────────────────────────

function parseDefaultTerms(value: unknown): CompanySettings['defaultTerms'] {
    if (!value) return DEFAULT_SETTINGS.defaultTerms;
    if (Array.isArray(value)) return value as CompanySettings['defaultTerms'];
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed as CompanySettings['defaultTerms'];
        } catch {
            return DEFAULT_SETTINGS.defaultTerms;
        }
    }
    return DEFAULT_SETTINGS.defaultTerms;
}

function mapRowToRecord(companyRow: any): CompanyRecord {
    const settingsRow = Array.isArray(companyRow.company_settings)
        ? companyRow.company_settings[0]
        : companyRow.company_settings;

    const settings: CompanySettings = {
        ...DEFAULT_SETTINGS,
        companyName: companyRow?.name ?? '',
        mobile: companyRow?.phone ?? DEFAULT_SETTINGS.mobile,
        email: companyRow?.email ?? DEFAULT_SETTINGS.email,
        website: companyRow?.website ?? DEFAULT_SETTINGS.website,
        address: companyRow?.address ?? DEFAULT_SETTINGS.address,
        gstin: companyRow?.gst_number ?? DEFAULT_SETTINGS.gstin,
        pan: companyRow?.pan_number ?? DEFAULT_SETTINGS.pan,
        logoUrl: companyRow?.logo_url ?? DEFAULT_SETTINGS.logoUrl,
        primaryColor: companyRow?.primary_color ?? DEFAULT_SETTINGS.primaryColor,
        secondaryColor: companyRow?.secondary_color ?? DEFAULT_SETTINGS.secondaryColor,
        signatureImage: settingsRow?.signature_url ?? DEFAULT_SETTINGS.signatureImage,
        authorizedPersonName: settingsRow?.authorized_person ?? DEFAULT_SETTINGS.authorizedPersonName,
        designation: settingsRow?.designation ?? DEFAULT_SETTINGS.designation,
        bankName: settingsRow?.bank_name ?? DEFAULT_SETTINGS.bankName,
        accountName: settingsRow?.account_name ?? DEFAULT_SETTINGS.accountName,
        accountNumber: settingsRow?.account_number ?? DEFAULT_SETTINGS.accountNumber,
        ifsc: settingsRow?.ifsc ?? DEFAULT_SETTINGS.ifsc,
        branch: settingsRow?.branch ?? DEFAULT_SETTINGS.branch,
        upiId: settingsRow?.upi_id ?? DEFAULT_SETTINGS.upiId,
        prefix: settingsRow?.quotation_prefix ?? DEFAULT_SETTINGS.prefix,
        bookingPrefix: settingsRow?.booking_prefix ?? DEFAULT_SETTINGS.bookingPrefix,
        defaultValidity: `${(settingsRow?.default_validity_days ?? 30)} Days`,
        defaultTerms: parseDefaultTerms(settingsRow?.default_terms),
    };

    return {
        companyId: companyRow.id,
        ownerId: companyRow.owner_id,
        settings,
    };
}

function settingsToPayload(settings: CompanySettings, companyId?: string) {
    return {
        name: settings.companyName,
        address: settings.address,
        phone: settings.mobile,
        email: settings.email,
        website: settings.website,
        gst_number: settings.gstin,
        pan_number: settings.pan,
        logo_url: settings.logoUrl,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        authorized_person: settings.authorizedPersonName,
        designation: settings.designation,
        signature_url: settings.signatureImage,
        bank_name: settings.bankName,
        account_name: settings.accountName,
        account_number: settings.accountNumber,
        ifsc: settings.ifsc,
        branch: settings.branch,
        upi_id: settings.upiId,
        quotation_prefix: settings.prefix,
        booking_prefix: settings.bookingPrefix,
        default_validity_days: Number(settings.defaultValidity.replace(/\D/g, '')) || 30,
        default_terms: JSON.stringify(settings.defaultTerms),
        ...(companyId ? { company_id: companyId } : {}),
    };
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function getCompanyByUserId(_userId: string): Promise<CompanyRecord | null> {
    const data = await apiFetch<{ company: any }>('/api/company');
    if (!data?.company) return null;
    return mapRowToRecord(data.company);
}

export async function createCompany(_userId: string, settings: CompanySettings): Promise<CompanyRecord | null> {
    const data = await apiFetch<{ company: any }>('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToPayload(settings)),
    });
    if (!data?.company) return null;
    return mapRowToRecord(data.company);
}

export async function updateCompanySettings(companyId: string, settings: CompanySettings): Promise<CompanyRecord | null> {
    const data = await apiFetch<{ company: any }>(`/api/company/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToPayload(settings, companyId)),
    });
    if (!data?.company) return null;
    return mapRowToRecord(data.company);
}

export async function getCompanyById(companyId: string): Promise<CompanyRecord | null> {
    const data = await apiFetch<{ company: any }>(`/api/company/${companyId}`);
    if (!data?.company) return null;
    return mapRowToRecord(data.company);
}
