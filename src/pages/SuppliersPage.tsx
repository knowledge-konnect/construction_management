import ConfirmDialog from '@/components/ConfirmDialog';
import DataTable, { CellStack, CellText, RowActionButton, RowActions, type Column } from '@/components/ui/DataTable';
import { AppButton, Modal, PageHeader } from '@/components/ui/DesignSystem';
import { Field, Select, TextInput } from '@/components/ui/Form';
import { useToast } from '@/context/ToastContext';
import { INDIAN_STATES } from '@/lib/constants';
import { formatDate, isValidEmail, isValidMobile, isValidPincode } from '@/lib/utils';
import {
    createParty,
    deleteParty,
    listParties,
    updateParty,
    type PartyRecord,
} from '@/services/party.service';
import { Building2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type ContactPrimaryRole = 'customer' | 'supplier' | 'investor';

const EMPTY_FORM = {
    name: '',
    entityType: 'person' as 'person' | 'business',
    primaryRole: 'supplier' as ContactPrimaryRole,
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

const PARTY_PAGE_SIZE = 10;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export default function SuppliersPage() {
    const { push } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [parties, setParties] = useState<PartyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const currentRole: ContactPrimaryRole = 'supplier';

    const refresh = async () => {
        setLoading(true);
        setParties(await listParties(undefined, 'supplier', search));
        setLoading(false);
    };

    useEffect(() => { void refresh(); }, [search]);

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

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return parties.filter((party) => {
            if (!party.isSupplier) return false;
            if (!term) return true;
            return (
                party.name.toLowerCase().includes(term) ||
                (party.mobile ?? '').toLowerCase().includes(term) ||
                (party.email ?? '').toLowerCase().includes(term) ||
                (party.gstin ?? '').toLowerCase().includes(term)
            );
        });
    }, [parties, search]);


    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PARTY_PAGE_SIZE));
        if (page > totalPages) setPage(totalPages);
    }, [filtered.length, page]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, primaryRole: currentRole });
        setShowForm(true);
    };

    const openEdit = (party: PartyRecord) => {
        setEditingId(party.id);
        setForm({
            name: party.name,
            entityType: party.entityType,
            primaryRole: currentRole,
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
        const normalizedName = form.name.trim();
        const normalizedEmail = form.email.trim();
        const normalizedMobile = form.mobile.trim();
        const normalizedAddress = form.address.trim();
        const normalizedCity = form.city.trim();
        const normalizedState = form.state.trim();
        const normalizedPincode = form.pincode.trim();
        const normalizedGstin = form.gstin.trim().toUpperCase();
        const normalizedContactPerson = form.contactPersonName.trim();
        const normalizedNotes = form.notes.trim();

        if (!normalizedName) {
            push('error', 'Supplier name is required.');
            return;
        }
        if (normalizedEmail && !isValidEmail(normalizedEmail)) {
            push('error', 'Enter a valid email address.');
            return;
        }
        if (normalizedMobile && !isValidMobile(normalizedMobile)) {
            push('error', 'Enter a valid 10-digit mobile number.');
            return;
        }
        if (normalizedPincode && !isValidPincode(normalizedPincode)) {
            push('error', 'Enter a valid 6-digit PIN code.');
            return;
        }
        if (normalizedGstin && !GSTIN_REGEX.test(normalizedGstin)) {
            push('error', 'Enter a valid GSTIN.');
            return;
        }

        const payload = {
            name: normalizedName,
            entityType: form.entityType,
            contactPersonName: normalizedContactPerson || null,
            partyType: currentRole,
            isCustomer: false,
            isSupplier: true,
            isInvestor: false,
            email: normalizedEmail,
            mobile: normalizedMobile,
            address: normalizedAddress,
            city: normalizedCity,
            state: normalizedState,
            pincode: normalizedPincode,
            gstin: normalizedGstin,
            notes: normalizedNotes,
        };

        setIsSubmitting(true);
        const result = editingId ? await updateParty(editingId, payload) : await createParty(payload);
        setIsSubmitting(false);

        if (!result) {
            push('error', editingId
                ? 'We could not update this supplier right now. Please review the details and try again.'
                : 'We could not create this supplier right now. Please review the details and try again.');
            return;
        }

        push('success', editingId ? 'Supplier details updated successfully.' : 'Supplier created successfully.');
        closeForm();
        void refresh();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteParty(deleteId);
        setDeleteId(null);
        if (ok) {
            push('success', 'Supplier deleted successfully.');
            void refresh();
        } else {
            push('error', 'We could not delete this supplier right now. Please try again.');
        }
    };


    const columns: Column<PartyRecord>[] = [
        {
            key: 'name',
            header: 'Name',
            sortValue: (p) => p.name,
            cell: (p) => <CellStack title={p.name} subtitle={p.entityType === 'business' ? 'Business' : 'Person'} />,
        },
        {
            key: 'contact',
            header: 'Contact',
            cell: (p) => <CellStack title={p.mobile || '—'} subtitle={p.email} />,
        },
        {
            key: 'location',
            header: 'Location',
            sortValue: (p) => [p.city, p.state].filter(Boolean).join(', ') || null,
            cell: (p) => <CellText>{[p.city, p.state].filter(Boolean).join(', ')}</CellText>,
        },
        {
            key: 'added',
            header: 'Added',
            sortValue: (p) => Date.parse(p.createdAt) || null,
            cell: (p) => <CellText>{formatDate(p.createdAt)}</CellText>,
        },
        {
            key: 'actions',
            header: 'Actions',
            kind: 'actions',
            cell: (p) => (
                <RowActions>
                    <RowActionButton label="Edit supplier" icon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(p)} />
                    <RowActionButton label="Delete supplier" tone="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteId(p.id)} />
                </RowActions>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Suppliers"
                description="Manage supplier records and keep procurement contact details available for purchase orders and vendor follow-up."
                actions={!showForm ? (
                    <AppButton onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add Supplier
                    </AppButton>
                ) : undefined}
            />

            <div className="flex justify-end">
                <div className="w-full max-w-sm">
                    <label className="relative block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
                        <input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search suppliers by name, mobile or email"
                            className="w-full rounded-xl border border-[var(--border-strong)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--text)] placeholder-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                    </label>
                </div>
            </div>

            {showForm && (
                <Modal eyebrow="Supplier" title={editingId ? 'Edit supplier' : 'Add supplier'} onClose={closeForm} size="xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label={form.entityType === 'business' ? 'Business Name' : 'Supplier Name'} required>
                                <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.entityType === 'business' ? 'Business or company name' : 'Supplier name'} required />
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
                                <Select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                                    <option value="">Select state</option>
                                    {INDIAN_STATES.map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </Select>
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <AppButton variant="secondary" onClick={closeForm}>Cancel</AppButton>
                            <AppButton type="submit" loading={isSubmitting} loadingText={editingId ? 'Saving supplier…' : 'Adding supplier…'}>
                                {editingId ? 'Save supplier' : 'Add supplier'}
                            </AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <DataTable
                caption="Suppliers"
                columns={columns}
                rows={filtered}
                rowKey={(party) => party.id}
                loading={loading}
                defaultSort={{ key: 'name', direction: 'asc' }}
                pagination={{ page, pageSize: PARTY_PAGE_SIZE, onPageChange: setPage }}
                empty={{
                    icon: <Building2 className="h-5 w-5" />,
                    title: parties.length === 0 ? 'No suppliers yet' : 'No suppliers match your search',
                    description: parties.length === 0 ? 'Create the first supplier record and keep your procurement details organised.' : 'Try a different search term or add a new supplier.',
                    action: parties.length === 0 ? <AppButton onClick={openCreate}>Add supplier</AppButton> : undefined,
                }}
            />

            {deleteId && (
                <ConfirmDialog
                    open={Boolean(deleteId)}
                    title="Delete supplier"
                    message="This will remove the supplier record from the company directory."
                    onCancel={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    confirmLabel="Delete supplier"
                    danger
                />
            )}
        </div>
    );
}
