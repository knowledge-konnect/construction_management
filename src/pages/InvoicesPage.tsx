import { AppButton, DataTable, PageHeader, PremiumCard, StatusPill } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { apiGet, apiPost } from '@/services/apiClient';
import { createCustomer, listCustomers } from '@/services/customer.service';
import { listParties, type PartyRecord } from '@/services/party.service';
import { listProjects } from '@/services/project.service';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function formatCurrency(value: unknown) {
    return money.format(Number(value ?? 0));
}

function getToday() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
}

export default function InvoicesPage() {
    const { company } = useCompany();
    const { push } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedProjectId = searchParams.get('projectId') ?? '';
    const [invoices, setInvoices] = useState<any[]>([]);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [partyCustomers, setPartyCustomers] = useState<PartyRecord[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateInvoiceForm, setShowCreateInvoiceForm] = useState(false);
    const [showCreateReceiptForm, setShowCreateReceiptForm] = useState(false);
    const [savingInvoice, setSavingInvoice] = useState(false);
    const [savingReceipt, setSavingReceipt] = useState(false);
    const [allocationTarget, setAllocationTarget] = useState<{ receiptId: string; receiptNumber: string } | null>(null);
    const [allocationAmount, setAllocationAmount] = useState('');
    const [allocationInvoiceId, setAllocationInvoiceId] = useState('');
    const [invoiceForm, setInvoiceForm] = useState({
        customerId: '',
        projectId: '',
        invoiceNumber: '',
        invoiceDate: getToday(),
        dueDate: '',
        amount: '',
        notes: '',
    });
    const [receiptForm, setReceiptForm] = useState({
        customerId: '',
        projectId: '',
        amount: '',
        receivedDate: getToday(),
        referenceNumber: '',
        notes: '',
    });

    const customerOptions = useMemo(() => {
        const merged = new Map<string, { id: string; name: string; email?: string; mobile?: string; address?: string; city?: string; state?: string; pincode?: string }>();

        for (const customer of customers) {
            if (!customer?.id) continue;
            merged.set(customer.id, {
                id: customer.id,
                name: customer.name ?? 'Unknown customer',
                email: customer.email ?? '',
                mobile: customer.mobile ?? '',
                address: customer.address ?? '',
                city: customer.city ?? '',
                state: customer.state ?? '',
                pincode: customer.pincode ?? '',
            });
        }

        for (const party of partyCustomers) {
            if (!party?.id || merged.has(party.id)) continue;
            merged.set(party.id, {
                id: party.id,
                name: party.name ?? 'Unknown customer',
                email: party.email ?? '',
                mobile: party.mobile ?? '',
                address: party.address ?? '',
                city: party.city ?? '',
                state: party.state ?? '',
                pincode: party.pincode ?? '',
            });
        }

        return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
    }, [customers, partyCustomers]);

    const customerMap = useMemo(() => new Map(customerOptions.map((customer) => [customer.id, customer])), [customerOptions]);
    const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

    const setProjectScope = (nextProjectId: string) => {
        const params = new URLSearchParams(searchParams);
        if (nextProjectId) {
            params.set('projectId', nextProjectId);
        } else {
            params.delete('projectId');
        }
        setSearchParams(params, { replace: true });
        setInvoiceForm((previous) => ({ ...previous, projectId: nextProjectId }));
        setReceiptForm((previous) => ({ ...previous, projectId: nextProjectId }));
    };

    const loadData = async () => {
        if (!company) {
            setInvoices([]);
            setReceipts([]);
            setCustomers([]);
            setProjects([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const query = new URLSearchParams();
        if (selectedProjectId) query.set('projectId', selectedProjectId);

        const [invoiceResult, receiptResult, customerResult, partyResult, projectResult] = await Promise.all([
            apiGet<{ invoices: any[] }>(`/api/invoices${query.toString() ? `?${query.toString()}` : ''}`),
            apiGet<{ receipts: any[] }>(`/api/receipts${query.toString() ? `?${query.toString()}` : ''}`),
            listCustomers(),
            listParties(undefined, 'customer'),
            listProjects(),
        ]);

        setInvoices(invoiceResult.data?.invoices ?? []);
        setReceipts(receiptResult.data?.receipts ?? []);
        setCustomers(customerResult);
        setPartyCustomers(partyResult);
        setProjects(projectResult);
        setLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, [company?.companyId, selectedProjectId]);

    useEffect(() => {
        if (!selectedProjectId) {
            setInvoiceForm((previous) => (previous.projectId ? { ...previous, projectId: '' } : previous));
            return;
        }

        if (!invoiceForm.projectId) {
            setInvoiceForm((previous) => ({ ...previous, projectId: selectedProjectId }));
        }
    }, [selectedProjectId, invoiceForm.projectId]);

    useEffect(() => {
        if (!selectedProjectId) {
            setReceiptForm((previous) => (previous.projectId ? { ...previous, projectId: '' } : previous));
            return;
        }

        if (!receiptForm.projectId) {
            setReceiptForm((previous) => ({ ...previous, projectId: selectedProjectId }));
        }
    }, [selectedProjectId, receiptForm.projectId]);

    const totals = useMemo(() => {
        const issued = invoices.filter((invoice) => String(invoice.status ?? '').trim() !== 'Cancelled');
        const outstanding = issued.reduce((sum, invoice) => {
            const grandTotal = Number(invoice.grand_total ?? 0);
            const paid = Number(invoice.paid_amount ?? 0);
            return sum + Math.max(0, grandTotal - paid);
        }, 0);

        const cashReceived = receipts.filter((receipt) => !receipt.voidedAt && !receipt.voided_at).reduce((sum, receipt) => sum + Number(receipt.amount ?? 0), 0);
        const allocated = receipts.filter((receipt) => !receipt.voidedAt && !receipt.voided_at).reduce((sum, receipt) => sum + Number(receipt.allocatedAmount ?? receipt.allocated_amount ?? 0), 0);
        const unallocated = receipts.filter((receipt) => !receipt.voidedAt && !receipt.voided_at).reduce((sum, receipt) => sum + Number(receipt.unallocatedAmount ?? receipt.unallocated_amount ?? 0), 0);

        return {
            count: issued.length,
            billed: issued.reduce((sum, invoice) => sum + Number(invoice.grand_total ?? 0), 0),
            outstanding,
            cashReceived,
            allocated,
            unallocated,
        };
    }, [invoices, receipts]);

    const ensureCustomerSelection = async (customerId: string) => {
        if (!customerId) {
            throw new Error('Select a customer before creating an invoice.');
        }

        if (customers.some((customer) => customer.id === customerId)) {
            return customerId;
        }

        const party = partyCustomers.find((candidate) => candidate.id === customerId);
        if (!party) {
            throw new Error('Selected customer could not be found.');
        }

        const created = await createCustomer(company?.companyId ?? '', {
            name: party.name,
            email: party.email ?? '',
            mobile: party.mobile ?? '',
            address: party.address ?? '',
            city: party.city ?? '',
            state: party.state ?? '',
            pincode: party.pincode ?? '',
            partyId: party.id,
        });

        if (!created) {
            throw new Error('We could not sync this customer with the finance records.');
        }

        setCustomers((previous) => (previous.some((item) => item.id === created.id) ? previous : [...previous, created]));
        return created.id;
    };

    const handleCreateInvoice = async () => {
        if (!invoiceForm.customerId) {
            push('error', 'Select a customer before creating an invoice.');
            return;
        }

        if (!invoiceForm.amount || Number(invoiceForm.amount) <= 0) {
            push('error', 'Invoice amount must be greater than zero.');
            return;
        }

        setSavingInvoice(true);
        try {
            const resolvedCustomerId = await ensureCustomerSelection(invoiceForm.customerId);
            setInvoiceForm((previous) => ({ ...previous, customerId: resolvedCustomerId }));

            const payload = {
                invoice: {
                    customer_id: resolvedCustomerId,
                    project_id: invoiceForm.projectId || null,
                    invoice_number: invoiceForm.invoiceNumber || `INV-${Date.now()}`,
                    invoice_date: invoiceForm.invoiceDate || getToday(),
                    due_date: invoiceForm.dueDate || null,
                    status: 'Draft',
                    notes: invoiceForm.notes || null,
                    supply_type: 'intra_state',
                    is_gst_invoice: false,
                    tax_inclusive: false,
                    items: [
                        {
                            description: 'Professional service / supply item',
                            quantity: 1,
                            unit: 'nos',
                            rate: Number(invoiceForm.amount),
                            tax_percentage: 0,
                            total_amount: Number(invoiceForm.amount),
                        },
                    ],
                },
            };

            const result = await apiPost<{ invoice: any }>('/api/invoices', payload);
            if (result.error) {
                push('error', result.error);
                return;
            }

            push('success', 'Invoice saved successfully.');
            setShowCreateInvoiceForm(false);
            setInvoiceForm({
                customerId: '',
                projectId: '',
                invoiceNumber: '',
                invoiceDate: getToday(),
                dueDate: '',
                amount: '',
                notes: '',
            });
            await loadData();
        } finally {
            setSavingInvoice(false);
        }
    };

    const handleIssueInvoice = async (id: string) => {
        const result = await apiPost<{ invoice: any }>(`/api/invoices/${id}/issue`, {});
        if (result.error) {
            push('error', result.error);
            return;
        }
        push('success', 'Invoice issued.');
        await loadData();
    };

    const handleCancelInvoice = async (id: string) => {
        const result = await apiPost<{ invoice: any }>(`/api/invoices/${id}/cancel`, {});
        if (result.error) {
            push('error', result.error);
            return;
        }
        push('success', 'Invoice cancelled.');
        await loadData();
    };

    const handleCreateReceipt = async () => {
        if (!receiptForm.customerId || !receiptForm.amount || Number(receiptForm.amount) <= 0) {
            push('error', 'Customer and receipt amount are required.');
            return;
        }

        setSavingReceipt(true);
        try {
            const resolvedCustomerId = await ensureCustomerSelection(receiptForm.customerId);
            setReceiptForm((previous) => ({ ...previous, customerId: resolvedCustomerId }));

            const result = await apiPost<{ receipt: any }>('/api/receipts', {
                receipt: {
                    customerId: resolvedCustomerId,
                    projectId: receiptForm.projectId || null,
                    amount: Number(receiptForm.amount),
                    receivedDate: receiptForm.receivedDate || getToday(),
                    paymentMethod: 'cash',
                    referenceNumber: receiptForm.referenceNumber || null,
                    notes: receiptForm.notes || null,
                },
            });

            if (result.error) {
                push('error', result.error);
                return;
            }

            push('success', 'Receipt saved successfully.');
            setShowCreateReceiptForm(false);
            setReceiptForm({
                customerId: '',
                projectId: '',
                amount: '',
                receivedDate: getToday(),
                referenceNumber: '',
                notes: '',
            });
            await loadData();
        } finally {
            setSavingReceipt(false);
        }
    };

    const handleAllocate = async () => {
        if (!allocationTarget || !allocationInvoiceId || !allocationAmount || Number(allocationAmount) <= 0) {
            push('error', 'Choose an invoice and enter a valid allocation amount.');
            return;
        }

        const result = await apiPost<{ allocation?: any; error?: string }>(`/api/receipts/${allocationTarget.receiptId}/allocations`, {
            invoiceId: allocationInvoiceId,
            amount: Number(allocationAmount),
        });

        if (result.error) {
            push('error', result.error);
            return;
        }

        push('success', `Allocated to invoice: ${allocationTarget.receiptNumber}`);
        setAllocationTarget(null);
        setAllocationInvoiceId('');
        setAllocationAmount('');
        await loadData();
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <PageHeader
                title={selectedProjectId ? `Finance — ${projects.find((project) => project.id === selectedProjectId)?.name ?? 'Project'}` : 'Finance'}
                description="Track invoices, customer payments, and project-level collections in one place."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <AppButton variant="secondary" onClick={() => setShowCreateReceiptForm((value) => !value)}>
                            {showCreateReceiptForm ? 'Close receipt' : 'Add receipt'}
                        </AppButton>
                        <AppButton onClick={() => setShowCreateInvoiceForm((value) => !value)}>
                            {showCreateInvoiceForm ? 'Close invoice' : 'Add invoice'}
                        </AppButton>
                    </div>
                }
            />

            <PremiumCard className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Project view</p>
                        <p className="mt-1 text-sm text-[var(--text)]">
                            {selectedProjectId ? 'Showing only this project’s financial records.' : 'Showing all company financial records.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedProjectId}
                            onChange={(event) => setProjectScope(event.target.value)}
                            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--text)] md:w-72"
                        >
                            <option value="">All projects</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                        {selectedProjectId && (
                            <AppButton variant="secondary" onClick={() => setProjectScope('')}>
                                View all
                            </AppButton>
                        )}
                    </div>
                </div>
            </PremiumCard>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <PremiumCard className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Invoices</p>
                    <p className="mt-3 text-2xl font-bold text-[var(--text)]">{totals.count}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Active records</p>
                </PremiumCard>
                <PremiumCard className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Billed</p>
                    <p className="mt-3 text-2xl font-bold text-[var(--text)]">{formatCurrency(totals.billed)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Total invoiced</p>
                </PremiumCard>
                <PremiumCard className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Outstanding</p>
                    <p className="mt-3 text-2xl font-bold text-[var(--text)]">{formatCurrency(totals.outstanding)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Due from customers</p>
                </PremiumCard>
                <PremiumCard className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Received</p>
                    <p className="mt-3 text-2xl font-bold text-[var(--text)]">{formatCurrency(totals.cashReceived)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Actual cash in</p>
                </PremiumCard>
                <PremiumCard className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Allocated</p>
                    <p className="mt-3 text-2xl font-bold text-[var(--text)]">{formatCurrency(totals.allocated)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Matched to invoices</p>
                </PremiumCard>
                <PremiumCard className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Pending</p>
                    <p className="mt-3 text-2xl font-bold text-[var(--text)]">{formatCurrency(totals.unallocated)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Not yet matched</p>
                </PremiumCard>
            </div>

            {showCreateInvoiceForm && (
                <PremiumCard className="p-4 md:p-5">
                    <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Create draft invoice</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Customer</span>
                            <select
                                value={invoiceForm.customerId}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, customerId: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                            >
                                <option value="">Select customer</option>
                                {customerOptions.map((customer) => (
                                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Project</span>
                            <select
                                value={invoiceForm.projectId}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, projectId: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                            >
                                <option value="">Company-wide / general</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Invoice number</span>
                            <input
                                value={invoiceForm.invoiceNumber}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, invoiceNumber: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                                placeholder="INV-2026-001"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Invoice date</span>
                            <input
                                type="date"
                                value={invoiceForm.invoiceDate}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, invoiceDate: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Due date</span>
                            <input
                                type="date"
                                value={invoiceForm.dueDate}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, dueDate: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Amount</span>
                            <input
                                type="number"
                                step="0.01"
                                value={invoiceForm.amount}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, amount: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                                placeholder="250000"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)] md:col-span-2">
                            <span>Notes</span>
                            <textarea
                                value={invoiceForm.notes}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, notes: event.target.value }))}
                                className="min-h-[96px] w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                                placeholder="Invoice notes"
                            />
                        </label>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <AppButton variant="secondary" onClick={() => setShowCreateInvoiceForm(false)}>
                            Cancel
                        </AppButton>
                        <AppButton onClick={() => void handleCreateInvoice()} loading={savingInvoice} loadingText="Saving invoice">
                            Save draft
                        </AppButton>
                    </div>
                </PremiumCard>
            )}

            {showCreateReceiptForm && (
                <PremiumCard className="p-4 md:p-5">
                    <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Create receipt</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Customer</span>
                            <select
                                value={receiptForm.customerId}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, customerId: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                            >
                                <option value="">Select customer</option>
                                {customerOptions.map((customer) => (
                                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Project</span>
                            <select
                                value={receiptForm.projectId}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, projectId: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                            >
                                <option value="">General / company level</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Amount</span>
                            <input
                                type="number"
                                step="0.01"
                                value={receiptForm.amount}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, amount: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                                placeholder="25000"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Received date</span>
                            <input
                                type="date"
                                value={receiptForm.receivedDate}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, receivedDate: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)] md:col-span-2">
                            <span>Reference number</span>
                            <input
                                value={receiptForm.referenceNumber}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, referenceNumber: event.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                                placeholder="UTR / cheque / bank ref"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)] md:col-span-2">
                            <span>Notes</span>
                            <textarea
                                value={receiptForm.notes}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, notes: event.target.value }))}
                                className="min-h-[96px] w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                                placeholder="Payment notes"
                            />
                        </label>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <AppButton variant="secondary" onClick={() => setShowCreateReceiptForm(false)}>
                            Cancel
                        </AppButton>
                        <AppButton onClick={() => void handleCreateReceipt()} loading={savingReceipt} loadingText="Saving receipt">
                            Save receipt
                        </AppButton>
                    </div>
                </PremiumCard>
            )}

            {loading ? (
                <PremiumCard className="p-6 text-sm text-[var(--text-secondary)]">Loading finance records…</PremiumCard>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                        <PremiumCard className="p-4 md:p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--text)]">Invoices</h2>
                            </div>
                            <DataTable
                                headers={['Invoice', 'Customer', 'Project', 'Amount', 'Status', 'Actions']}
                                rows={invoices.map((invoice) => {
                                    const customer = customerMap.get(invoice.customer_id ?? '') ?? invoice.customer ?? null;
                                    const project = projectMap.get(invoice.project_id ?? '') ?? invoice.project ?? null;
                                    return (
                                        <tr key={invoice.id} className="align-top">
                                            <td className="px-4 py-3.5 text-[13px] font-medium text-[var(--text)]">{invoice.invoice_number ?? '—'}</td>
                                            <td className="px-4 py-3.5 text-[13px] text-[var(--text)]">{customer?.name ?? 'Unknown customer'}</td>
                                            <td className="px-4 py-3.5 text-[13px] text-[var(--text)]">{project?.name ?? 'General'}</td>
                                            <td className="px-4 py-3.5 text-[13px] font-medium text-[var(--text)] tabular-nums">{formatCurrency(invoice.grand_total ?? 0)}</td>
                                            <td className="px-4 py-3.5">
                                                <StatusPill
                                                    label={String(invoice.status ?? 'Draft')}
                                                    tone={invoice.status === 'Cancelled' ? 'danger' : invoice.status === 'Issued' ? 'success' : 'info'}
                                                />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-wrap gap-2">
                                                    {String(invoice.status ?? 'Draft') === 'Draft' && (
                                                        <AppButton variant="secondary" onClick={() => void handleIssueInvoice(invoice.id)}>
                                                            Issue
                                                        </AppButton>
                                                    )}
                                                    {String(invoice.status ?? 'Draft') === 'Issued' && (
                                                        <AppButton variant="outline" onClick={() => void handleCancelInvoice(invoice.id)}>
                                                            Cancel
                                                        </AppButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            />
                        </PremiumCard>

                        <PremiumCard className="p-4 md:p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--text)]">Receipts</h2>
                            </div>
                            <DataTable
                                headers={['Receipt', 'Customer', 'Project', 'Amount', 'Allocated', 'Unallocated', 'Actions']}
                                rows={receipts.map((receipt) => {
                                    const customer = customerMap.get(receipt.customerId ?? '') ?? receipt.customer ?? null;
                                    const project = projectMap.get(receipt.projectId ?? '') ?? receipt.project ?? null;
                                    return (
                                        <tr key={receipt.id} className="align-top">
                                            <td className="px-4 py-3.5 text-[13px] font-medium text-[var(--text)]">{receipt.receiptNumber ?? '—'}</td>
                                            <td className="px-4 py-3.5 text-[13px] text-[var(--text)]">{customer?.name ?? 'Unknown customer'}</td>
                                            <td className="px-4 py-3.5 text-[13px] text-[var(--text)]">{project?.name ?? 'General'}</td>
                                            <td className="px-4 py-3.5 text-[13px] font-medium text-[var(--text)] tabular-nums">{formatCurrency(receipt.amount ?? 0)}</td>
                                            <td className="px-4 py-3.5 text-[13px] text-[var(--text)] tabular-nums">{formatCurrency(receipt.allocatedAmount ?? receipt.allocated_amount ?? 0)}</td>
                                            <td className="px-4 py-3.5 text-[13px] text-[var(--text)] tabular-nums">{formatCurrency(receipt.unallocatedAmount ?? receipt.unallocated_amount ?? 0)}</td>
                                            <td className="px-4 py-3.5">
                                                <AppButton
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setAllocationTarget({ receiptId: receipt.id, receiptNumber: receipt.receiptNumber ?? 'Receipt' });
                                                        setAllocationInvoiceId('');
                                                        setAllocationAmount('');
                                                    }}
                                                >
                                                    Allocate
                                                </AppButton>
                                            </td>
                                        </tr>
                                    );
                                })}
                            />
                        </PremiumCard>
                    </div>

                    <div className="space-y-6">
                        <PremiumCard className="p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Quick guide</p>
                            <div className="mt-4 space-y-4 text-sm text-[var(--text)]">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Current scope</p>
                                    <p className="mt-1 font-medium">{selectedProjectId ? projects.find((project) => project.id === selectedProjectId)?.name ?? 'Selected project' : 'All company projects'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Actual finance</p>
                                    <p className="mt-1">Invoices and receipts are the main records for customer billing and cash collection.</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Booking receipts</p>
                                    <p className="mt-1">Booking and flat-sale records stay separate and are not counted as cash in this ledger.</p>
                                </div>
                            </div>
                        </PremiumCard>

                        {allocationTarget && (
                            <PremiumCard className="p-4 md:p-5">
                                <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Allocate payment: {allocationTarget.receiptNumber}</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="space-y-2 text-sm text-[var(--text)]">
                                        <span>Invoice</span>
                                        <select
                                            value={allocationInvoiceId}
                                            onChange={(event) => setAllocationInvoiceId(event.target.value)}
                                            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                                        >
                                            <option value="">Select invoice</option>
                                            {invoices
                                                .filter((invoice) => String(invoice.status ?? '').trim() !== 'Cancelled')
                                                .map((invoice) => (
                                                    <option key={invoice.id} value={invoice.id}>
                                                        {invoice.invoice_number ?? invoice.id}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
                                    <label className="space-y-2 text-sm text-[var(--text)]">
                                        <span>Amount</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={allocationAmount}
                                            onChange={(event) => setAllocationAmount(event.target.value)}
                                            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
                                            placeholder="5000"
                                        />
                                    </label>
                                </div>
                                <div className="mt-5 flex justify-end gap-2">
                                    <AppButton variant="secondary" onClick={() => setAllocationTarget(null)}>
                                        Cancel
                                    </AppButton>
                                    <AppButton onClick={() => void handleAllocate()}>
                                        Apply allocation
                                    </AppButton>
                                </div>
                            </PremiumCard>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
