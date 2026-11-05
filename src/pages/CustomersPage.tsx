import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonLoader } from '@/components/loading/Loaders';
import { AppButton, Modal, PageHeader, TablePagination } from '@/components/ui/DesignSystem';
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
import { Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type ContactPrimaryRole = 'customer' | 'supplier' | 'investor';

const EMPTY_FORM = {
  name: '',
  entityType: 'person' as 'person' | 'business',
  primaryRole: 'customer' as ContactPrimaryRole,
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

export default function CustomersPage() {
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

  const currentRole: ContactPrimaryRole = 'customer';

  const refresh = async () => {
    setLoading(true);
    setParties(await listParties(undefined, 'customer', search));
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
      if (!party.isCustomer) return false;
      if (!term) return true;
      return (
        party.name.toLowerCase().includes(term) ||
        (party.mobile ?? '').toLowerCase().includes(term) ||
        (party.email ?? '').toLowerCase().includes(term) ||
        (party.gstin ?? '').toLowerCase().includes(term)
      );
    });
  }, [parties, search]);

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
      push('error', 'Customer name is required.');
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
      isCustomer: true,
      isSupplier: false,
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
        ? 'We could not update this customer right now. Please review the details and try again.'
        : 'We could not create this customer right now. Please review the details and try again.');
      return;
    }

    push('success', editingId ? 'Customer details updated successfully.' : 'Customer created successfully.');
    closeForm();
    void refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteParty(deleteId);
    setDeleteId(null);
    if (ok) {
      push('success', 'Customer deleted successfully.');
      void refresh();
    } else {
      push('error', 'We could not delete this customer right now. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer records and keep contact details available across projects and quotations."
        actions={!showForm ? (
          <AppButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Customer
          </AppButton>
        ) : undefined}
      />

      <div className="flex justify-end">
        <div className="w-full max-w-sm">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search customers by name, mobile or email"
              className="w-full rounded-xl border border-[#D0D5DD] bg-white py-2.5 pl-9 pr-3 text-sm text-[#17243A] placeholder-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25"
            />
          </label>
        </div>
      </div>

      {showForm && (
        <Modal eyebrow="Customer" title={editingId ? 'Edit customer' : 'Add customer'} onClose={closeForm} size="xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={form.entityType === 'business' ? 'Business Name' : 'Customer Name'} required>
                <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.entityType === 'business' ? 'Business or company name' : 'Customer name'} required />
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
              <AppButton type="submit" loading={isSubmitting} loadingText={editingId ? 'Saving customer…' : 'Adding customer…'}>
                {editingId ? 'Save customer' : 'Add customer'}
              </AppButton>
            </div>
          </form>
        </Modal>
      )}

      {loading ? (
        <SkeletonLoader variant="table" rows={8} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEE8] bg-slate-50/80 p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <p className="text-base font-semibold text-[#17243A]">
            {parties.length === 0 ? 'No customers yet' : 'No customers match your search'}
          </p>
          <p className="mt-2 text-sm text-[#667085]">
            {parties.length === 0 ? 'Create the first customer record and keep project and quotation details organised.' : 'Try a different search term or add a new customer.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-[#E6E8EC] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)] md:block">
            <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
              <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
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
                      <div className="font-medium text-[#17243A]">{party.name}</div>
                      <div className="text-xs text-slate-500">{party.entityType === 'business' ? 'Business' : 'Person'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[#344054]">Customer</td>
                    <td className="px-4 py-3.5 text-[#344054]">
                      <div>{party.mobile || '-'}</div>
                      <div className="text-xs text-slate-500">{party.email || '-'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[#667085]">{[party.city, party.state].filter(Boolean).join(', ') || '-'}</td>
                    <td className="px-4 py-3.5 text-xs text-[#667085]">{formatDate(party.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(party)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(party.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3">
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
              <div key={party.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#17243A]">{party.name}</p>
                    <p className="text-xs text-slate-500">{party.entityType === 'business' ? 'Business' : 'Person'} • Customer</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(party)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(party.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-500" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-[#344054]">
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
          title="Delete customer"
          message="This will remove the customer record from the company directory."
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
          confirmLabel="Delete customer"
          danger
        />
      )}
    </div>
  );
}
