import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, Modal, PageHeader, TablePagination } from '@/components/ui/DesignSystem';
import { Field, Select, TextInput } from '@/components/ui/Form';
import { useToast } from '@/context/ToastContext';
import { INDIAN_STATES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type CustomerRecord,
} from '@/services/customer.service';
import { Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const EMPTY_FORM = { name: '', email: '', mobile: '', address: '', city: '', state: '', pincode: '' };
const CUSTOMERS_TABLE_PAGE_SIZE = 10;

export default function CustomersPage() {
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const refresh = async () => {
    setLoading(true);
    setCustomers(await listCustomers());
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

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
    if (!search.trim()) return customers;
    const s = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(s) || c.mobile.includes(s) || c.email.toLowerCase().includes(s),
    );
  }, [customers, search]);

  const pagedFiltered = useMemo(() => {
    const start = (page - 1) * CUSTOMERS_TABLE_PAGE_SIZE;
    return filtered.slice(start, start + CUSTOMERS_TABLE_PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / CUSTOMERS_TABLE_PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [filtered.length, page]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (c: CustomerRecord) => {
    setEditingId(c.id);
    setForm({ name: c.name, email: c.email, mobile: c.mobile, address: c.address, city: c.city || '', state: c.state || '', pincode: c.pincode || '' });
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
      push('error', 'Customer name is required.');
      return;
    }
    setIsSubmitting(true);
    const result = editingId
      ? await updateCustomer(editingId, form)
      : await createCustomer('', form);
    setIsSubmitting(false);
    if (!result) {
      push('error', editingId ? 'Could not update customer.' : 'Could not create customer.');
      return;
    }
    push('success', editingId ? 'Customer updated.' : 'Customer added.');
    closeForm();
    void refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteCustomer(deleteId);
    setDeleteId(null);
    if (ok) {
      push('success', 'Customer deleted.');
      void refresh();
    } else {
      push('error', 'Could not delete customer.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer profiles and keep contact details available across projects and quotations."
        actions={!showForm ? (
          <AppButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Customer
          </AppButton>
        ) : undefined}
      />

      {showForm && (
        <Modal eyebrow="Customer" title={editingId ? 'Edit customer' : 'Add customer'} onClose={closeForm} size="xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Customer Name" required>
                <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" required />
              </Field>
              <Field label="Mobile Number">
                <TextInput type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Phone number" />
              </Field>
              <Field label="Email Address">
                <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional" />
              </Field>
              <Field label="PIN Code">
                <TextInput value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Optional" />
              </Field>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">Address Details</p>
              <p className="mt-1 text-xs text-[#667085]">Optional details for billing, correspondence, and site follow-up.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Address" className="md:col-span-2">
                <TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Optional" />
              </Field>
              <Field label="City">
                <TextInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Optional" />
              </Field>
              <Field label="State">
                <Select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="secondary" onClick={closeForm}>Cancel</AppButton>
              <AppButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Add customer'}
              </AppButton>
            </div>
          </form>
        </Modal>
      )}

      <div className="w-full max-w-sm">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, mobile or email"
            className="w-full rounded-xl border border-[#D0D5DD] bg-white py-2.5 pl-9 pr-3 text-sm text-[#17243A] placeholder-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25"
          />
        </label>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E6E8EC] bg-white p-10 text-center text-sm text-[#667085] shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
          Loading customers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEE8] bg-slate-50/80 p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <p className="text-base font-semibold text-[#17243A]">
            {customers.length === 0 ? 'No customers yet' : 'No customers match your search'}
          </p>
          <p className="mt-2 text-sm text-[#667085]">
            {customers.length === 0 ? 'They\u2019ll also appear here automatically when you save a quotation.' : 'Try a different search term or add a new customer.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-[#E6E8EC] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)] md:block">
            <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
              <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                <tr>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Name</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Mobile</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Email</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Location</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Added</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EC] bg-white">
                {pagedFiltered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-medium text-[#17243A]">{c.name}</td>
                    <td className="px-4 py-3.5 text-[#344054]">{c.mobile || '-'}</td>
                    <td className="px-4 py-3.5 text-[#344054]">{c.email || '-'}</td>
                    <td className="px-4 py-3.5 text-[#667085]">{[c.city, c.state].filter(Boolean).join(', ') || '-'}</td>
                    <td className="px-4 py-3.5 text-xs text-[#667085]">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(c)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(c.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3">
              <TablePagination
                page={page}
                pageSize={CUSTOMERS_TABLE_PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {pagedFiltered.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-slate-800 truncate">{c.name}</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-slate-500 hover:text-[#1D4ED8] hover:bg-slate-100 rounded" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-500">
                  {c.mobile && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /> {c.mobile}</div>}
                  {c.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" /> {c.email}</div>}
                  {(c.city || c.state) && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> {[c.city, c.state].filter(Boolean).join(', ')}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Customer?"
        message="This removes the customer record. Existing quotations already linked to them are not affected."
        danger
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
