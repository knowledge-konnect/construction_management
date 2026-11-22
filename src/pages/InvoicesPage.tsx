import ConfirmDialog from '@/components/ConfirmDialog';
import DataTable, { CellText, RowActions, type Column } from '@/components/ui/DataTable';
import { AppButton, Modal, PageHeader, PremiumCard, StatCard, StatusPill } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';
import { createCustomer, listCustomers } from '@/services/customer.service';
import { listParties, type PartyRecord } from '@/services/party.service';
import { listProjects } from '@/services/project.service';
import type jsPDF from 'jspdf';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
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

function invoicePdfFilename(invoiceNumber: string | null | undefined, fallback: string) {
    const base = (invoiceNumber || fallback).toString().trim();
    return `${base.replace(/[^a-zA-Z0-9_-]+/g, '-') || fallback}.pdf`;
}

function receiptPdfFilename(receiptNumber: string | null | undefined, fallback: string) {
    const base = (receiptNumber || fallback).toString().trim();
    return `${base.replace(/[^a-zA-Z0-9_-]+/g, '-') || fallback}.pdf`;
}

function formatDate(value: unknown) {
    if (!value) return '—';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
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
    const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
    const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
    const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
    const [deleteReceiptId, setDeleteReceiptId] = useState<string | null>(null);
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
            const paid = Number(invoice.paid_amount ?? invoice.paidAmount ?? 0);
            const invoiceOutstanding = Number(invoice.outstanding_amount ?? invoice.outstandingAmount ?? Math.max(0, grandTotal - paid));
            return sum + Math.max(0, invoiceOutstanding);
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

    const resetInvoiceForm = () => {
        setInvoiceForm({
            customerId: '',
            projectId: selectedProjectId || '',
            invoiceNumber: '',
            invoiceDate: getToday(),
            dueDate: '',
            amount: '',
            notes: '',
        });
        setEditingInvoiceId(null);
    };

    const resetReceiptForm = () => {
        setReceiptForm({
            customerId: '',
            projectId: selectedProjectId || '',
            amount: '',
            receivedDate: getToday(),
            referenceNumber: '',
            notes: '',
        });
        setEditingReceiptId(null);
    };

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

    const handleOpenInvoiceForm = (invoice?: any) => {
        if (invoice) {
            setEditingInvoiceId(invoice.id);
            setInvoiceForm({
                customerId: invoice.customer_id ?? '',
                projectId: invoice.project_id ?? '',
                invoiceNumber: invoice.invoice_number ?? '',
                invoiceDate: invoice.invoice_date ?? getToday(),
                dueDate: invoice.due_date ?? '',
                amount: String(invoice.grand_total ?? 0),
                notes: invoice.notes ?? '',
            });
        } else {
            resetInvoiceForm();
        }
        setShowCreateInvoiceForm(true);
        setShowCreateReceiptForm(false);
    };

    const handleOpenReceiptForm = (receipt?: any) => {
        if (receipt) {
            setEditingReceiptId(receipt.id);
            setReceiptForm({
                customerId: receipt.customerId ?? receipt.customer_id ?? '',
                projectId: receipt.projectId ?? receipt.project_id ?? '',
                amount: String(receipt.amount ?? 0),
                receivedDate: receipt.receivedDate ?? receipt.received_date ?? getToday(),
                referenceNumber: receipt.referenceNumber ?? receipt.reference_number ?? '',
                notes: receipt.notes ?? '',
            });
        } else {
            resetReceiptForm();
        }
        setShowCreateReceiptForm(true);
        setShowCreateInvoiceForm(false);
    };

    const downloadInvoicePdf = async (invoice: any) => {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);

        const customerName = (customerMap.get(invoice.customer_id ?? '') ?? invoice.customer ?? null)?.name ?? 'Customer';
        const projectName = (projectMap.get(invoice.project_id ?? '') ?? invoice.project ?? null)?.name ?? 'Project';
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 16;

        doc.setFillColor(23, 36, 58);
        doc.rect(0, 0, pageWidth, 26, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('INVOICE', margin, 16);
        doc.setFontSize(9);
        doc.text(String(invoice.invoice_number ?? 'Draft Invoice'), pageWidth - margin, 16, { align: 'right' });

        doc.setTextColor(24, 35, 58);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = [
            `Customer: ${customerName}`,
            `Project: ${projectName}`,
            `Issue date: ${formatDate(invoice.invoice_date ?? invoice.invoiceDate)}`,
            `Due date: ${formatDate(invoice.due_date ?? invoice.dueDate) || '—'}`,
        ];
        lines.forEach((line, index) => {
            doc.text(line, margin, 40 + index * 7);
        });

        const rows = (Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [{
            description: 'Professional service / supply item',
            quantity: 1,
            rate: Number(invoice.grand_total ?? 0),
            total_amount: Number(invoice.grand_total ?? 0),
        }]).map((item: any) => [
            item.description ?? 'Item',
            String(item.quantity ?? 1),
            formatCurrency(item.rate ?? 0),
            formatCurrency(item.total_amount ?? item.rate ?? 0),
        ]);

        autoTable(doc, {
            startY: 82,
            head: [['Description', 'Qty', 'Rate', 'Amount']],
            body: rows,
            styles: { fontSize: 9, cellPadding: 3, textColor: [25, 35, 58], lineColor: [215, 220, 230] },
            headStyles: { fillColor: [23, 36, 58], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            margin: { left: margin, right: margin },
        });

        const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Total invoice', pageWidth - 70, finalY + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(invoice.grand_total ?? 0), pageWidth - margin, finalY + 14, { align: 'right' });

        doc.setDrawColor(225, 230, 235);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(92, 101, 117);
        doc.text('BuilderDocs Finance — generated from the construction ledger', margin, pageHeight - 10);

        doc.save(invoicePdfFilename(invoice.invoice_number ?? invoice.id, 'invoice'));
    };

    const downloadReceiptPdf = async (receipt: any) => {
        const { default: jsPDF } = await import('jspdf');
        const customerName = (customerMap.get(receipt.customerId ?? receipt.customer_id ?? '') ?? receipt.customer ?? null)?.name ?? 'Customer';
        const projectName = (projectMap.get(receipt.projectId ?? receipt.project_id ?? '') ?? receipt.project ?? null)?.name ?? 'Project';
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 16;

        doc.setFillColor(23, 36, 58);
        doc.rect(0, 0, pageWidth, 26, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('RECEIPT', margin, 16);
        doc.setFontSize(9);
        doc.text(String(receipt.receiptNumber ?? 'Receipt'), pageWidth - margin, 16, { align: 'right' });

        doc.setTextColor(24, 35, 58);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = [
            `Customer: ${customerName}`,
            `Project: ${projectName}`,
            `Date: ${formatDate(receipt.receivedDate ?? receipt.received_date ?? '')}`,
            `Payment method: ${String(receipt.paymentMethod ?? receipt.payment_method ?? 'Cash')}`,
            `Reference: ${receipt.referenceNumber ?? receipt.reference_number ?? '—'}`,
        ];
        lines.forEach((line, index) => {
            doc.text(line, margin, 42 + index * 7);
        });

        doc.setFillColor(244, 247, 250);
        doc.roundedRect(margin, 110, pageWidth - margin * 2, 26, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Receipt amount', margin + 6, 122);
        doc.text('Allocated', margin + 6, 129);
        doc.text('Unallocated', margin + 6, 136);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(receipt.amount ?? 0), pageWidth - margin - 6, 122, { align: 'right' });
        doc.text(formatCurrency(receipt.allocatedAmount ?? receipt.allocated_amount ?? 0), pageWidth - margin - 6, 129, { align: 'right' });
        doc.text(formatCurrency(receipt.unallocatedAmount ?? receipt.unallocated_amount ?? 0), pageWidth - margin - 6, 136, { align: 'right' });

        doc.setDrawColor(225, 230, 235);
        doc.line(margin, 166, pageWidth - margin, 166);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(92, 101, 117);
        doc.text('BuilderDocs Finance — generated from the construction ledger', margin, 175);

        doc.save(receiptPdfFilename(receipt.receiptNumber ?? receipt.id, 'receipt'));
    };

    const openInvoiceFormForCreate = () => {
        resetInvoiceForm();
        setShowCreateInvoiceForm(true);
        setShowCreateReceiptForm(false);
    };

    const openReceiptFormForCreate = () => {
        resetReceiptForm();
        setShowCreateReceiptForm(true);
        setShowCreateInvoiceForm(false);
    };

    const handleDeleteInvoice = async () => {
        if (!deleteInvoiceId) return;
        const result = await apiDelete<{ ok?: boolean; error?: string }>(`/api/invoices/${deleteInvoiceId}`);
        if (result.error) {
            push('error', result.error);
            return;
        }
        push('success', 'Invoice deleted.');
        setDeleteInvoiceId(null);
        await loadData();
    };

    const handleDeleteReceipt = async () => {
        if (!deleteReceiptId) return;
        const receipt = receipts.find((item) => item.id === deleteReceiptId);
        const allocatedAmount = Number(receipt?.allocatedAmount ?? receipt?.allocated_amount ?? 0);
        if (allocatedAmount > 0) {
            push('error', 'Allocated receipts are read-only and cannot be deleted.');
            setDeleteReceiptId(null);
            return;
        }

        const result = await apiDelete<{ ok?: boolean; error?: string }>(`/api/receipts/${deleteReceiptId}`);
        if (result.error) {
            push('error', result.error);
            return;
        }
        push('success', 'Receipt deleted.');
        setDeleteReceiptId(null);
        await loadData();
    };

    const handleSaveInvoice = async () => {
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

            const result = editingInvoiceId
                ? await apiPut<{ invoice: any }>(`/api/invoices/${editingInvoiceId}`, payload.invoice)
                : await apiPost<{ invoice: any }>('/api/invoices', payload);

            if (result.error) {
                push('error', result.error);
                return;
            }

            push('success', editingInvoiceId ? 'Invoice updated successfully.' : 'Invoice saved successfully.');
            setShowCreateInvoiceForm(false);
            resetInvoiceForm();
            await loadData();
        } finally {
            setSavingInvoice(false);
        }
    };

    const handleSaveReceipt = async () => {
        if (!receiptForm.customerId || !receiptForm.amount || Number(receiptForm.amount) <= 0) {
            push('error', 'Customer and receipt amount are required.');
            return;
        }

        const existingReceipt = editingReceiptId ? receipts.find((item) => item.id === editingReceiptId) : null;
        const allocatedAmount = Number(existingReceipt?.allocatedAmount ?? existingReceipt?.allocated_amount ?? 0);
        if (editingReceiptId && allocatedAmount > 0) {
            push('error', 'Allocated receipts are read-only and cannot be edited.');
            return;
        }

        setSavingReceipt(true);
        try {
            const resolvedCustomerId = await ensureCustomerSelection(receiptForm.customerId);
            setReceiptForm((previous) => ({ ...previous, customerId: resolvedCustomerId }));

            const body = {
                customerId: resolvedCustomerId,
                projectId: receiptForm.projectId || null,
                amount: Number(receiptForm.amount),
                receivedDate: receiptForm.receivedDate || getToday(),
                paymentMethod: 'cash',
                referenceNumber: receiptForm.referenceNumber || null,
                notes: receiptForm.notes || null,
            };

            const result = editingReceiptId
                ? await apiPut<{ receipt: any }>(`/api/receipts/${editingReceiptId}`, body)
                : await apiPost<{ receipt: any }>('/api/receipts', { receipt: body });

            if (result.error) {
                push('error', result.error);
                return;
            }

            push('success', editingReceiptId ? 'Receipt updated successfully.' : 'Receipt saved successfully.');
            setShowCreateReceiptForm(false);
            resetReceiptForm();
            await loadData();
        } finally {
            setSavingReceipt(false);
        }
    };

    const handleCreateInvoice = async () => {
        await handleSaveInvoice();
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
        await handleSaveReceipt();
    };

    const handleAllocate = async () => {
        if (!allocationTarget || !allocationInvoiceId || !allocationAmount || Number(allocationAmount) <= 0) {
            push('error', 'Choose an invoice and enter a valid allocation amount.');
            return;
        }

        const result = await apiPost<{
            allocation?: any;
            receiptRemaining?: number;
            invoiceOutstanding?: number;
            receiptRemainingAfter?: number;
            invoiceOutstandingAfter?: number;
            allocatedAmount?: number;
            error?: string;
        }>(`/api/receipts/${allocationTarget.receiptId}/allocations`, {
            invoiceId: allocationInvoiceId,
            amount: Number(allocationAmount),
        });

        if (result.error) {
            push('error', result.error);
            return;
        }

        const allocationData = result.data;

        const receiptRemainingAfter = Number(allocationData?.receiptRemainingAfter ?? allocationData?.receiptRemaining);
        if (Number.isFinite(receiptRemainingAfter)) {
            setReceipts((previous) => previous.map((receipt) => {
                if ((receipt.id ?? receipt.receiptId) !== allocationTarget.receiptId) return receipt;
                const amount = Number(receipt.amount ?? 0);
                const unallocatedAmount = Math.max(0, receiptRemainingAfter);
                return {
                    ...receipt,
                    unallocatedAmount,
                    allocatedAmount: Math.max(0, amount - unallocatedAmount),
                };
            }));
        }

        const invoiceOutstandingAfter = Number(allocationData?.invoiceOutstandingAfter ?? allocationData?.invoiceOutstanding);
        if (Number.isFinite(invoiceOutstandingAfter)) {
            setInvoices((previous) => previous.map((invoice) => {
                if ((invoice.id ?? invoice.invoiceId) !== allocationInvoiceId) return invoice;
                const grandTotal = Number(invoice.grand_total ?? invoice.grandTotal ?? 0);
                const outstanding = Math.max(0, invoiceOutstandingAfter);
                return {
                    ...invoice,
                    outstanding_amount: outstanding,
                    outstandingAmount: outstanding,
                    paid_amount: Math.max(0, grandTotal - outstanding),
                    paidAmount: Math.max(0, grandTotal - outstanding),
                };
            }));
        }

        push('success', `Allocated to invoice: ${allocationTarget.receiptNumber}`);
        setAllocationTarget(null);
        setAllocationInvoiceId('');
        setAllocationAmount('');
        await loadData();
    };


    type InvoiceRow = (typeof invoices)[number];
    type ReceiptRow = (typeof receipts)[number];

    const invoiceColumns: Column<InvoiceRow>[] = [
        {
            key: 'invoice',
            header: 'Invoice',
            sortValue: (i) => i.invoice_number ?? null,
            cell: (i) => <span className="font-semibold text-[var(--text)]">{i.invoice_number ?? '—'}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (i) => <CellText>{(customerMap.get(i.customer_id ?? '') ?? i.customer ?? null)?.name ?? 'Unknown customer'}</CellText>,
        },
        {
            key: 'project',
            header: 'Project',
            cell: (i) => <CellText>{(projectMap.get(i.project_id ?? '') ?? i.project ?? null)?.name ?? 'General'}</CellText>,
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            sortValue: (i) => Number(i.grand_total ?? 0),
            cell: (i) => <span className="font-medium tabular-nums text-[var(--text)]">{formatCurrency(i.grand_total ?? 0)}</span>,
        },
        {
            key: 'paid',
            header: 'Paid',
            align: 'right',
            sortValue: (i) => Number(i.paid_amount ?? i.paidAmount ?? 0),
            cell: (i) => <span className="tabular-nums text-[var(--text)]">{formatCurrency(i.paid_amount ?? i.paidAmount ?? 0)}</span>,
        },
        {
            key: 'outstanding',
            header: 'Outstanding',
            align: 'right',
            sortValue: (i) => Number(i.outstanding_amount ?? i.outstandingAmount ?? Math.max(0, Number(i.grand_total ?? 0) - Number(i.paid_amount ?? i.paidAmount ?? 0))),
            cell: (i) => {
                const grandTotal = Number(i.grand_total ?? 0);
                const paid = Number(i.paid_amount ?? i.paidAmount ?? 0);
                const outstanding = Number(i.outstanding_amount ?? i.outstandingAmount ?? Math.max(0, grandTotal - paid));
                return <span className="tabular-nums text-[var(--text)]">{formatCurrency(outstanding)}</span>;
            },
        },
        {
            key: 'status',
            header: 'Status',
            cell: (i) => <StatusPill label={String(i.status ?? 'Draft')} tone={i.status === 'Cancelled' ? 'danger' : i.status === 'Issued' ? 'success' : 'info'} />,
        },
        {
            key: 'actions',
            header: 'Actions',
            kind: 'actions',
            cell: (i) => (
                <RowActions>
                    {String(i.status ?? 'Draft') === 'Draft' && (
                        <>
                            <AppButton variant="secondary" className="!min-h-[32px] !px-2 !py-1 text-xs" onClick={() => handleOpenInvoiceForm(i)}>
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </AppButton>
                            <AppButton variant="secondary" className="!min-h-[32px] !px-2 !py-1 text-xs" onClick={() => setDeleteInvoiceId(i.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </AppButton>
                            <AppButton variant="secondary" className="!min-h-[32px] !px-2 !py-1 text-xs" onClick={() => void downloadInvoicePdf(i)}>
                                <Download className="h-3.5 w-3.5" />
                                PDF
                            </AppButton>
                            <AppButton variant="secondary" className="!min-h-[32px] !px-2.5 !py-1 text-xs" onClick={() => void handleIssueInvoice(i.id)}>
                                Issue
                            </AppButton>
                        </>
                    )}
                    {String(i.status ?? 'Draft') === 'Issued' && (
                        <>
                            <AppButton variant="secondary" className="!min-h-[32px] !px-2 !py-1 text-xs" onClick={() => void downloadInvoicePdf(i)}>
                                <Download className="h-3.5 w-3.5" />
                                PDF
                            </AppButton>
                            <AppButton variant="outline" className="!min-h-[32px] !px-2.5 !py-1 text-xs" onClick={() => void handleCancelInvoice(i.id)}>
                                Cancel
                            </AppButton>
                        </>
                    )}
                </RowActions>
            ),
        },
    ];

    const receiptColumns: Column<ReceiptRow>[] = [
        {
            key: 'receipt',
            header: 'Receipt',
            sortValue: (r) => r.receiptNumber ?? null,
            cell: (r) => <span className="font-semibold text-[var(--text)]">{r.receiptNumber ?? '—'}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (r) => <CellText>{(customerMap.get(r.customerId ?? '') ?? r.customer ?? null)?.name ?? 'Unknown customer'}</CellText>,
        },
        {
            key: 'project',
            header: 'Project',
            cell: (r) => <CellText>{(projectMap.get(r.projectId ?? '') ?? r.project ?? null)?.name ?? 'General'}</CellText>,
        },
        {
            key: 'date',
            header: 'Date',
            align: 'right',
            sortValue: (r) => String(r.receivedDate ?? r.received_date ?? ''),
            cell: (r) => <span className="tabular-nums text-[var(--text)]">{formatDate(r.receivedDate ?? r.received_date ?? '')}</span>,
        },
        {
            key: 'method',
            header: 'Method',
            cell: (r) => <CellText>{String(r.paymentMethod ?? r.payment_method ?? 'Cash')}</CellText>,
        },
        {
            key: 'amount',
            header: 'Received',
            align: 'right',
            sortValue: (r) => Number(r.amount ?? 0),
            cell: (r) => <span className="font-medium tabular-nums text-[var(--text)]">{formatCurrency(r.amount ?? 0)}</span>,
        },
        {
            key: 'allocated',
            header: 'Allocated',
            align: 'right',
            sortValue: (r) => Number(r.allocatedAmount ?? r.allocated_amount ?? 0),
            cell: (r) => <span className="tabular-nums text-[var(--text)]">{formatCurrency(r.allocatedAmount ?? r.allocated_amount ?? 0)}</span>,
        },
        {
            key: 'unallocated',
            header: 'Unallocated',
            align: 'right',
            sortValue: (r) => Number(r.unallocatedAmount ?? r.unallocated_amount ?? 0),
            cell: (r) => <span className="tabular-nums text-[var(--text)]">{formatCurrency(r.unallocatedAmount ?? r.unallocated_amount ?? 0)}</span>,
        },
        {
            key: 'actions',
            header: 'Actions',
            kind: 'actions',
            cell: (r) => {
                const allocatedAmount = Number(r.allocatedAmount ?? r.allocated_amount ?? 0);
                const unallocatedAmount = Number(r.unallocatedAmount ?? r.unallocated_amount ?? 0);
                const readOnlyReceipt = allocatedAmount > 0;

                return (
                    <RowActions>
                        <AppButton
                            variant="secondary"
                            className="!min-h-[32px] !px-2 !py-1 text-[11px]"
                            disabled={readOnlyReceipt}
                            title={readOnlyReceipt ? 'Allocated receipts are read-only.' : 'Edit this receipt'}
                            onClick={() => handleOpenReceiptForm(r)}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </AppButton>
                        <AppButton
                            variant="secondary"
                            className="!min-h-[32px] !px-2 !py-1 text-[11px]"
                            disabled={readOnlyReceipt}
                            title={readOnlyReceipt ? 'Allocated receipts cannot be deleted.' : 'Delete this receipt'}
                            onClick={() => setDeleteReceiptId(r.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </AppButton>
                        <AppButton variant="secondary" className="!min-h-[32px] !px-2 !py-1 text-[11px]" onClick={() => void downloadReceiptPdf(r)}>
                            <Download className="h-3.5 w-3.5" />
                            PDF
                        </AppButton>
                        <AppButton
                            variant="secondary"
                            className="!min-h-[32px] !px-2.5 !py-1 text-xs"
                            disabled={unallocatedAmount <= 0}
                            title={unallocatedAmount <= 0 ? 'This receipt has no remaining balance to allocate.' : 'Allocate this receipt to an invoice'}
                            onClick={() => {
                                setAllocationTarget({ receiptId: r.id, receiptNumber: r.receiptNumber ?? 'Receipt' });
                                setAllocationInvoiceId('');
                                setAllocationAmount('');
                            }}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Allocate
                        </AppButton>
                    </RowActions>
                );
            },
        },
    ];

    return (
        <div className="space-y-5 p-4 md:p-6">
            <ConfirmDialog
                open={!!deleteInvoiceId}
                title="Delete invoice"
                message="This will remove the draft invoice and its line items. This action cannot be undone."
                confirmLabel="Delete invoice"
                danger
                onConfirm={() => void handleDeleteInvoice()}
                onCancel={() => setDeleteInvoiceId(null)}
            />
            <ConfirmDialog
                open={!!deleteReceiptId}
                title="Delete receipt"
                message="Delete this receipt only if it has not been allocated to invoice payments."
                confirmLabel="Delete receipt"
                danger
                onConfirm={() => void handleDeleteReceipt()}
                onCancel={() => setDeleteReceiptId(null)}
            />
            <PageHeader
                title={selectedProjectId ? `Finance — ${projects.find((project) => project.id === selectedProjectId)?.name ?? 'Project'}` : 'Finance'}
                description="Track invoices, customer payments, and project-level collections in one place."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <AppButton variant="secondary" onClick={() => {
                            if (showCreateReceiptForm) {
                                setShowCreateReceiptForm(false);
                                resetReceiptForm();
                            } else {
                                openReceiptFormForCreate();
                            }
                        }}>
                            <Plus className="h-4 w-4" />
                            {showCreateReceiptForm ? 'Close receipt' : 'Add receipt'}
                        </AppButton>
                        <AppButton onClick={() => {
                            if (showCreateInvoiceForm) {
                                setShowCreateInvoiceForm(false);
                                resetInvoiceForm();
                            } else {
                                openInvoiceFormForCreate();
                            }
                        }}>
                            <Plus className="h-4 w-4" />
                            {showCreateInvoiceForm ? 'Close invoice' : 'Add invoice'}
                        </AppButton>
                    </div>
                }
            />

            <PremiumCard className="p-3.5 md:p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Project view</p>
                        <p className="mt-1 text-sm text-[var(--text)]">
                            {selectedProjectId ? 'Showing only this project’s financial records.' : 'Showing all company financial records.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedProjectId}
                            onChange={(event) => setProjectScope(event.target.value)}
                            className="input-shell w-full md:w-72"
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

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard compact label="Invoices" value={totals.count} sub="Active records" className="min-h-[120px]" />
                <StatCard compact label="Total Invoiced" value={formatCurrency(totals.billed)} sub="Billed amount" className="min-h-[120px]" />
                <StatCard compact label="Outstanding" value={formatCurrency(totals.outstanding)} sub="Due from customers" className="min-h-[120px]" />
                <StatCard compact label="Total Received" value={formatCurrency(totals.cashReceived)} sub="Actual cash in" className="min-h-[120px]" />
                <StatCard compact label="Allocated" value={formatCurrency(totals.allocated)} sub="Matched to invoices" className="min-h-[120px]" />
                <StatCard compact label="Unallocated" value={formatCurrency(totals.unallocated)} sub="Not yet matched" className="min-h-[120px]" />
            </div>

            {showCreateInvoiceForm && (
                <Modal eyebrow="Invoice" title={editingInvoiceId ? 'Edit draft invoice' : 'Create draft invoice'} onClose={() => { setShowCreateInvoiceForm(false); resetInvoiceForm(); }} size="xl">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Customer</span>
                            <select
                                value={invoiceForm.customerId}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, customerId: event.target.value }))}
                                className="input-shell"
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
                                className="input-shell"
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
                                className="input-shell"
                                placeholder="INV-2026-001"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Invoice date</span>
                            <input
                                type="date"
                                value={invoiceForm.invoiceDate}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, invoiceDate: event.target.value }))}
                                className="input-shell"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Due date</span>
                            <input
                                type="date"
                                value={invoiceForm.dueDate}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, dueDate: event.target.value }))}
                                className="input-shell"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Amount</span>
                            <input
                                type="number"
                                step="0.01"
                                value={invoiceForm.amount}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, amount: event.target.value }))}
                                className="input-shell"
                                placeholder="250000"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)] md:col-span-2">
                            <span>Notes</span>
                            <textarea
                                value={invoiceForm.notes}
                                onChange={(event) => setInvoiceForm((previous) => ({ ...previous, notes: event.target.value }))}
                                className="input-shell min-h-[96px]"
                                placeholder="Invoice notes"
                            />
                        </label>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <AppButton variant="secondary" onClick={() => { setShowCreateInvoiceForm(false); resetInvoiceForm(); }}>
                            Cancel
                        </AppButton>
                        <AppButton onClick={() => void handleCreateInvoice()} loading={savingInvoice} loadingText={editingInvoiceId ? 'Updating invoice' : 'Saving invoice'}>
                            {editingInvoiceId ? 'Update invoice' : 'Save draft'}
                        </AppButton>
                    </div>
                </Modal>
            )}

            {showCreateReceiptForm && (
                <Modal eyebrow="Receipt" title={editingReceiptId ? 'Edit receipt' : 'Create receipt'} onClose={() => { setShowCreateReceiptForm(false); resetReceiptForm(); }} size="xl">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Customer</span>
                            <select
                                value={receiptForm.customerId}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, customerId: event.target.value }))}
                                className="input-shell"
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
                                className="input-shell"
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
                                className="input-shell"
                                placeholder="25000"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)]">
                            <span>Received date</span>
                            <input
                                type="date"
                                value={receiptForm.receivedDate}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, receivedDate: event.target.value }))}
                                className="input-shell"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)] md:col-span-2">
                            <span>Reference number</span>
                            <input
                                value={receiptForm.referenceNumber}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, referenceNumber: event.target.value }))}
                                className="input-shell"
                                placeholder="UTR / cheque / bank ref"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-[var(--text)] md:col-span-2">
                            <span>Notes</span>
                            <textarea
                                value={receiptForm.notes}
                                onChange={(event) => setReceiptForm((previous) => ({ ...previous, notes: event.target.value }))}
                                className="input-shell min-h-[96px]"
                                placeholder="Payment notes"
                            />
                        </label>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <AppButton variant="secondary" onClick={() => { setShowCreateReceiptForm(false); resetReceiptForm(); }}>
                            Cancel
                        </AppButton>
                        <AppButton onClick={() => void handleCreateReceipt()} loading={savingReceipt} loadingText={editingReceiptId ? 'Updating receipt' : 'Saving receipt'}>
                            {editingReceiptId ? 'Update receipt' : 'Save receipt'}
                        </AppButton>
                    </div>
                </Modal>
            )}

            {loading ? (
                <PremiumCard className="p-6 text-sm text-[var(--text-secondary)]">Loading finance records…</PremiumCard>
            ) : (
                <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
                    <div className="space-y-5">
                        <PremiumCard className="p-4 md:p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--text)]">Invoices</h2>
                            </div>
                            <DataTable
                                bare
                                caption="Invoices"
                                columns={invoiceColumns}
                                rows={invoices}
                                rowKey={(invoice) => String(invoice.id)}
                                empty={{ title: 'No invoices yet', description: 'Draft and issued invoices will appear here.' }}
                            />
                        </PremiumCard>

                        <PremiumCard className="p-4 md:p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--text)]">Receipts</h2>
                            </div>
                            <DataTable
                                bare
                                caption="Receipts"
                                columns={receiptColumns}
                                rows={receipts}
                                rowKey={(receipt) => String(receipt.id)}
                                empty={{ title: 'No receipts yet', description: 'Customer receipts you record will appear here.' }}
                            />
                        </PremiumCard>
                    </div>

                    <div className="space-y-5">
                        <PremiumCard className="p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Quick guide</p>
                            <div className="mt-4 space-y-4 text-sm text-[var(--text)]">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Current scope</p>
                                    <p className="mt-1 font-medium">{selectedProjectId ? projects.find((project) => project.id === selectedProjectId)?.name ?? 'Selected project' : 'All company projects'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Actual finance</p>
                                    <p className="mt-1">Invoices and receipts are the main records for customer billing and cash collection.</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Booking receipts</p>
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
                                            className="input-shell"
                                        >
                                            <option value="">Select invoice</option>
                                            {invoices
                                                .filter((invoice) => String(invoice.status ?? '').trim() === 'Issued')
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
                                            className="input-shell"
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
