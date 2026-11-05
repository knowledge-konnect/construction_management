import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, Modal, PageHeader, StatusPill, TablePagination } from '@/components/ui/DesignSystem';
import { Field, Select, TextInput } from '@/components/ui/Form';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import {
    createPartyResult,
    deleteParty,
    listParties,
    updatePartyResult,
    type PartyRecord,
    type PartyTypeFilter,
} from '@/services/party.service';
import { Building2, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, User, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

type ContactPrimaryRole = 'customer' | 'supplier' | 'investor' | 'general';

type PartiesPageProps = {
    pageRole?: ContactPrimaryRole;
};

const EMPTY_FORM = {
    name: '',
    entityType: 'person' as 'person' | 'business',
    primaryRole: 'general' as ContactPrimaryRole,
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    contactPersonName: '',
    notes: '',
};

function resolvePrimaryRoleFromFlags(isCustomer: boolean, isSupplier: boolean, isInvestor: boolean): ContactPrimaryRole {
    if (isCustomer) return 'customer';
    if (isSupplier) return 'supplier';
    if (isInvestor) return 'investor';
    return 'general';
}

const PARTY_PAGE_SIZE = 10;

export default function PartiesPage({ pageRole }: PartiesPageProps) {
    const { push } = useToast();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [parties, setParties] = useState<PartyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [activeTab, setActiveTab] = useState<PartyTypeFilter>(() => {
        if (pageRole) return pageRole;
        if (location.pathname === '/customers') return 'customer';
        if (location.pathname === '/suppliers') return 'supplier';
        if (location.pathname === '/investors') return 'investor';
        return 'all';
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const refresh = async () => {
        setLoading(true);
        const viewRole = pageRole ?? activeTab;
        setParties(await listParties(undefined, viewRole, search));
        setLoading(false);
    };

    useEffect(() => {
        const nextTab: PartyTypeFilter = pageRole ?? (
            location.pathname === '/customers'
                ? 'customer'
                : location.pathname === '/suppliers'
                    ? 'supplier'
                    : location.pathname === '/investors'
                        ? 'investor'
                        : 'all'
        );
        setActiveTab(nextTab);
    }, [location.pathname, pageRole]);

    useEffect(() => {
        void refresh();
    }, [activeTab]);

    useEffect(() => {
        setSearch(searchParams.get('search') ?? '');
    }, [searchParams]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (value.trim()) {
            setSearchParams({ search: value.trim() }, { replace: true });
            return;
        }
        setSearchParams({}, { replace: true });
    };

    useEffect(() => {
        void refresh();
    }, [search]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        const viewRole = pageRole ?? activeTab;
        return parties.filter((party) => {
            const matchesTab =
                viewRole === 'all' ||
                (viewRole === 'customer' && party.isCustomer) ||
                (viewRole === 'supplier' && party.isSupplier) ||
                (viewRole === 'investor' && party.isInvestor);
            if (!matchesTab) return false;
            if (!term) return true;
            return (
                party.name.toLowerCase().includes(term) ||
                (party.mobile ?? '').toLowerCase().includes(term) ||
                (party.email ?? '').toLowerCase().includes(term) ||
                (party.gstin ?? '').toLowerCase().includes(term)
            );
        });
    }, [activeTab, parties, search]);

    const pagedFiltered = useMemo(() => {
        const start = (page - 1) * PARTY_PAGE_SIZE;
        return filtered.slice(start, start + PARTY_PAGE_SIZE);
    }, [filtered, page]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PARTY_PAGE_SIZE));
        if (page > totalPages) setPage(totalPages);
    }, [filtered.length, page]);

    const openCreate = () => {
        setEditingId(null);
        const defaultRole = effectiveTab === 'all' ? 'general' : selectedPageRole;
        setForm({ ...EMPTY_FORM, primaryRole: defaultRole });
        setShowForm(true);
    };

    const openEdit = (party: PartyRecord) => {
        const role = resolvePrimaryRoleFromFlags(party.isCustomer, party.isSupplier, party.isInvestor);
        setEditingId(party.id);
        setForm({
            name: party.entityType === 'business' ? (party.name || '') : party.name,
            entityType: party.entityType,
            primaryRole: role,
            email: party.email,
            mobile: party.mobile,
            address: party.address,
            city: party.city ?? '',
            state: party.state ?? '',
            pincode: party.pincode ?? '',
            gstin: party.gstin ?? '',
            contactPersonName: party.contactPersonName ?? '',
            notes: party.notes ?? '',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            push('error', `${roleLabel} name is required.`);
            return;
        }

        const role = isGeneralContactCreate ? 'general' : (form.primaryRole ?? selectedPageRole);
        const roleFlags = {
            isCustomer: role === 'customer',
            isSupplier: role === 'supplier',
            isInvestor: role === 'investor',
        };

        setIsSubmitting(true);
        const payload = {
            name: form.entityType === 'business' ? form.name : form.name,
            entityType: form.entityType,
            contactPersonName: form.contactPersonName || null,
            partyType: role,
            isCustomer: roleFlags.isCustomer,
            isSupplier: roleFlags.isSupplier,
            isInvestor: roleFlags.isInvestor,
            email: form.email,
            mobile: form.mobile,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            gstin: form.gstin,
            notes: form.notes,
        };

        const result = editingId ? await updatePartyResult(editingId, payload) : await createPartyResult(payload);
        setIsSubmitting(false);
        if (!result.ok) {
            push('error', result.error || (editingId ? `Could not update ${roleLabelLower}.` : `Could not create ${roleLabelLower}.`));
            return;
        }
        push('success', editingId ? `${roleLabel} updated.` : `${roleLabel} added.`);
        closeForm();
        void refresh();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteParty(deleteId);
        setDeleteId(null);
        if (ok) {
            push('success', `${roleLabel} deleted.`);
            void refresh();
        } else {
            push('error', `Could not delete ${roleLabelLower}.`);
        }
    };

    const primaryRoleLabel = (party: PartyRecord) => {
        const primaryRole = resolvePrimaryRoleFromFlags(party.isCustomer, party.isSupplier, party.isInvestor);
        if (primaryRole === 'general') return 'General';
        return primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1);
    };

    const effectiveTab = pageRole ?? activeTab;
    const roleMeta = (() => {
        switch (effectiveTab) {
            case 'supplier':
                return {
                    label: 'Supplier',
                    labelLower: 'supplier',
                    plural: 'Suppliers',
                    emptyTitle: 'No suppliers yet',
                    emptyDescription: 'Create the first supplier record and keep your procurement details organised.',
                    searchPlaceholder: 'Search suppliers by name, mobile or email',
                };
            case 'investor':
                return {
                    label: 'Investor',
                    labelLower: 'investor',
                    plural: 'Investors',
                    emptyTitle: 'No investors yet',
                    emptyDescription: 'Create the first investor record and keep funding relationships organised.',
                    searchPlaceholder: 'Search investors by name, mobile or email',
                };
            case 'all':
                return {
                    label: 'General Contact',
                    labelLower: 'general contact',
                    plural: 'Contacts',
                    emptyTitle: 'No contacts yet',
                    emptyDescription: 'Create a shared contact without assigning it to a customer, supplier or investor role.',
                    searchPlaceholder: 'Search contacts by name, mobile or email',
                };
            case 'customer':
            default:
                return {
                    label: 'Customer',
                    labelLower: 'customer',
                    plural: 'Customers',
                    emptyTitle: 'No customers yet',
                    emptyDescription: 'Create the first customer record and keep project and quotation details organised.',
                    searchPlaceholder: 'Search customers by name, mobile or email',
                };
        }
    })();

    const pageTitle = effectiveTab === 'customer' ? 'Customers' : effectiveTab === 'supplier' ? 'Suppliers' : effectiveTab === 'investor' ? 'Investors' : 'Contacts';
    const pageDescription = effectiveTab === 'customer'
        ? 'Manage customer records and reuse contact details across projects and quotations.'
        : effectiveTab === 'supplier'
            ? 'Manage supplier records and keep contact details available for purchases and procurement.'
            : effectiveTab === 'investor'
                ? 'Manage investor records and keep funding relationships organised by project.'
                : effectiveTab === 'all'
                    ? 'Manage general contacts and landowners.'
                    : 'Create a single shared contact profile and reuse it across customers, suppliers, and investors.';
    const roleLabel = roleMeta.label;
    const roleLabelLower = roleMeta.labelLower;
    const selectedPageRole: ContactPrimaryRole = effectiveTab === 'supplier' ? 'supplier' : effectiveTab === 'investor' ? 'investor' : effectiveTab === 'all' ? 'general' : 'customer';
    const isGeneralContactsView = effectiveTab === 'all';
    const isGeneralContactCreate = isGeneralContactsView && !editingId;

    const contactCountLabel = `${filtered.length} ${filtered.length === 1 ? 'contact' : 'contacts'}`;

    return (
        <div className="space-y-4">
            <PageHeader
                title={pageTitle}
                description={pageDescription}
                actions={!showForm ? (
                    <AppButton onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        {activeTab === 'customer' ? 'Add Customer' : activeTab === 'supplier' ? 'Add Supplier' : activeTab === 'investor' ? 'Add Investor' : 'Add Contact'}
                    </AppButton>
                ) : undefined}
            />

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-medium text-[#64748B]">{contactCountLabel}</p>
                <div className="w-full md:max-w-md">
                    <label className="relative block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder={roleMeta.searchPlaceholder}
                            className="w-full rounded-xl border border-[#D0D5DD] bg-white py-2.5 pl-9 pr-3 text-sm text-[#17243A] placeholder-slate-400 shadow-sm transition-colors focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25"
                        />
                    </label>
                </div>
            </div>

            {showForm && (
                <Modal eyebrow={roleLabel} title={isGeneralContactCreate ? 'Add General Contact' : editingId ? `Edit ${roleLabelLower}` : `Add ${roleLabelLower}`} onClose={closeForm} size="xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isGeneralContactCreate ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Name" required>
                                    <TextInput
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Enter person or business name"
                                        required
                                    />
                                </Field>
                                <Field label="Contact Type" required>
                                    <Select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value as 'person' | 'business' })} required>
                                        <option value="person">Person</option>
                                        <option value="business">Business</option>
                                    </Select>
                                </Field>
                                <Field label="Mobile Number">
                                    <TextInput
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        value={form.mobile}
                                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                        placeholder="Enter mobile number"
                                    />
                                </Field>
                                <Field label="Email">
                                    <TextInput
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="Enter email address"
                                    />
                                </Field>
                                <Field label="Address" className="md:col-span-2">
                                    <TextInput
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        placeholder="Enter address"
                                    />
                                </Field>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Field label={form.entityType === 'business' ? 'Business Name' : 'Contact Name'} required>
                                        <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.entityType === 'business' ? 'Business or company name' : 'Full name'} required />
                                    </Field>
                                    <Field label="Entity Type">
                                        <Select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value as 'person' | 'business' })}>
                                            <option value="person">Person</option>
                                            <option value="business">Business</option>
                                        </Select>
                                    </Field>
                                </div>

                                {form.entityType === 'business' && (
                                    <Field label="Contact Person">
                                        <TextInput value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} placeholder="Primary contact person" />
                                    </Field>
                                )}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Field label="Email Address">
                                        <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional" />
                                    </Field>
                                    <Field label="Mobile Number">
                                        <TextInput type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Optional" />
                                    </Field>
                                    <Field label="GSTIN">
                                        <TextInput value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} placeholder="Optional" />
                                    </Field>
                                    <Field label="PIN Code">
                                        <TextInput value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Optional" />
                                    </Field>
                                    <Field label="Address" className="md:col-span-2">
                                        <TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Optional" />
                                    </Field>
                                    <Field label="City">
                                        <TextInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Optional" />
                                    </Field>
                                    <Field label="State">
                                        <TextInput value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Optional" />
                                    </Field>
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <AppButton variant="secondary" onClick={closeForm}>Cancel</AppButton>
                            <AppButton type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving…' : isGeneralContactCreate ? 'Add Contact' : editingId ? `Save ${roleLabelLower}` : `Add ${roleLabelLower}`}
                            </AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            {loading ? (
                <div className="rounded-2xl border border-[#E6E8EC] bg-white p-10 text-center text-sm text-[#667085] shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
                    Loading {roleMeta.plural.toLowerCase()}…
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D8DEE8] bg-slate-50/80 p-8 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#2454D6] shadow-sm ring-1 ring-slate-200">
                        {effectiveTab === 'all' ? <Users className="h-5 w-5" /> : activeTab === 'customer' ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                    </div>
                    <p className="text-base font-semibold text-[#17243A]">
                        {effectiveTab === 'all'
                            ? parties.length === 0
                                ? 'No contacts yet'
                                : 'No contacts match your search'
                            : parties.length === 0
                                ? roleMeta.emptyTitle
                                : `No ${roleMeta.plural.toLowerCase()} match your search`}
                    </p>
                    <p className="mt-2 text-sm text-[#667085]">
                        {effectiveTab === 'all'
                            ? parties.length === 0
                                ? 'Add your first general contact to reuse it for landowners and shared company records.'
                                : 'Try a different search term or add a new contact.'
                            : parties.length === 0
                                ? roleMeta.emptyDescription
                                : `Try a different search term or add a new ${roleMeta.labelLower}.`}
                    </p>
                    {effectiveTab === 'all' && parties.length === 0 && (
                        <div className="mt-4">
                            <AppButton onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Add Contact
                            </AppButton>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="hidden overflow-hidden rounded-[24px] border border-[#E6E8EC] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)] md:block">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#17243B] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3.5 text-left font-semibold text-white">Name</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-white">Role</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-white">Contact</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-white">Location</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-white">Added</th>
                                    <th className="px-4 py-3.5 text-center font-semibold text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {pagedFiltered.map((party) => (
                                    <tr key={party.id} className="transition-colors hover:bg-slate-50/80">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF1FF] text-sm font-semibold text-[#2454D6]">
                                                    {party.name.slice(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-[#17243A]">{party.name}</div>
                                                    <div className="text-xs text-slate-500">{party.entityType === 'business' ? 'Business' : 'Person'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <StatusPill label={primaryRoleLabel(party)} tone={primaryRoleLabel(party) === 'Customer' ? 'info' : 'neutral'} />
                                        </td>
                                        <td className="px-4 py-3.5 text-[#344054]">
                                            <div className="font-medium">{party.mobile || '-'}</div>
                                            <div className="text-xs text-slate-500">{party.email || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-[#667085]">{[party.city, party.state].filter(Boolean).join(', ') || '-'}</td>
                                        <td className="px-4 py-3.5 text-xs font-medium text-[#667085]">{formatDate(party.createdAt)}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(party)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => setDeleteId(party.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="border-t border-[#E6E8EC] bg-slate-50/80 p-3">
                            <TablePagination
                                page={page}
                                pageSize={PARTY_PAGE_SIZE}
                                total={filtered.length}
                                onPageChange={setPage}
                            />
                        </div>
                    </div>

                    <div className="md:hidden space-y-3">
                        {pagedFiltered.map((party) => (
                            <div key={party.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF1FF] text-sm font-semibold text-[#2454D6]">
                                            {party.name.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#17243A]">{party.name}</p>
                                            <p className="text-xs text-slate-500">{party.entityType === 'business' ? 'Business' : 'Person'} • {primaryRoleLabel(party)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(party)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => setDeleteId(party.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-500" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-[#344054]">
                                    {party.mobile && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{party.mobile}</div>}
                                    {party.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{party.email}</div>}
                                    {[party.city, party.state].filter(Boolean).length > 0 && (
                                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{[party.city, party.state].filter(Boolean).join(', ')}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {deleteId && (
                <ConfirmDialog
                    open={Boolean(deleteId)}
                    title="Delete contact"
                    message="This will remove the shared contact record from the company directory."
                    onCancel={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    confirmLabel="Delete contact"
                    danger
                />
            )}
        </div>
    );
}
