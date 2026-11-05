import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, Modal, PageHeader, PremiumCard, StatusPill } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { listMasterData, type MasterItem } from '@/services/masterData.service';
import { listParties, type PartyRecord } from '@/services/party.service';
import type { ProjectRecord } from '@/services/project.service';
import { listProjects } from '@/services/project.service';
import {
    createProjectExpensePaymentResult,
    createProjectExpenseResult,
    deleteProjectExpense,
    listProjectExpensePayments,
    listProjectExpenses,
    type ProjectExpensePaymentRecord,
    type ProjectExpenseRecord,
    type ProjectExpenseType,
    updateProjectExpense,
    updateProjectExpenseResult
} from '@/services/projectCost.service';
import { ArrowUpRight, CreditCard, FileText, Loader2, Pencil, Plus, Trash2, TrendingUp, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

const emptyForm = {
    projectId: '',
    expenseType: 'direct' as ProjectExpenseType,
    category: 'Materials',
    description: '',
    supplierPartyId: '',
    supplierName: '',
    supplierBillNumber: '',
    billDate: '',
    dueDate: '',
    billAmount: '',
    status: 'unpaid' as 'unpaid' | 'partially_paid' | 'paid' | 'void',
    visibilityStatus: 'internal' as 'internal' | 'published',
};

const emptyPaymentForm = {
    amount: '',
    paymentDate: '',
    paymentMethodId: '',
    paymentMethod: 'cash' as 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other',
    referenceNumber: '',
    notes: '',
};

export default function ExpensesPage() {
    const { company } = useCompany();
    const { push } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [expenses, setExpenses] = useState<ProjectExpenseRecord[]>([]);
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const resolveWorkflowFromParams = () => {
        const workflowParam = searchParams.get('workflow');
        if (workflowParam === 'all' || workflowParam === 'direct' || workflowParam === 'supplier') return workflowParam;
        return 'all';
    };
    const [workflow, setWorkflow] = useState<'all' | 'direct' | 'supplier'>(resolveWorkflowFromParams);
    const [expenseCategories, setExpenseCategories] = useState<MasterItem[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<MasterItem[]>([]);
    const [showVoided, setShowVoided] = useState(false);
    const [statusAtModalOpen, setStatusAtModalOpen] = useState<'unpaid' | 'partially_paid' | 'paid' | 'void'>('unpaid');
    const [paymentsByExpenseId, setPaymentsByExpenseId] = useState<Record<string, ProjectExpensePaymentRecord[]>>({});
    const [availableSupplierContacts, setAvailableSupplierContacts] = useState<PartyRecord[]>([]);
    const [selectedSupplierContactId, setSelectedSupplierContactId] = useState('');
    const [paymentDialogExpenseId, setPaymentDialogExpenseId] = useState<string | null>(null);
    const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
    const [paymentSaving, setPaymentSaving] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') ?? '');

    const getActivePayments = (expenseId: string) => {
        return (paymentsByExpenseId[expenseId] ?? []).filter((payment) => !payment.voidedAt);
    };

    const getPaidAmount = (expense: ProjectExpenseRecord) => {
        return getActivePayments(expense.id).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    };

    const getOutstandingAmount = (expense: ProjectExpenseRecord) => {
        if (expense.status === 'void') return 0;
        return Math.max(0, Number(expense.billAmount ?? 0) - getPaidAmount(expense));
    };

    const toIsoDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isValidDateInput = (value: string) => {
        if (!value) return true;
        return !Number.isNaN(new Date(value).getTime());
    };

    const refresh = async (projectFilter = selectedProjectId || undefined) => {
        if (!company) {
            setExpenses([]);
            setProjects([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const [billRows, projectRows, categoryRows, paymentMethodRows] = await Promise.all([
            listProjectExpenses(projectFilter),
            listProjects(),
            listMasterData('expenseCategories'),
            listMasterData('paymentMethods'),
        ]);

        const paymentEntries = await Promise.all(
            billRows.map(async (expense) => {
                const records = await listProjectExpensePayments(expense.id);
                return [expense.id, records] as const;
            })
        );

        const nextPaymentsByExpenseId = paymentEntries.reduce<Record<string, ProjectExpensePaymentRecord[]>>((acc, [expenseId, records]) => {
            acc[expenseId] = records;
            return acc;
        }, {});

        setExpenses(billRows);
        setProjects(projectRows);
        setExpenseCategories(categoryRows);
        setPaymentMethods(paymentMethodRows);
        setPaymentsByExpenseId(nextPaymentsByExpenseId);
        setLoading(false);
    };

    useEffect(() => {
        void refresh(selectedProjectId || undefined);
    }, [company?.companyId, selectedProjectId]);

    useEffect(() => {
        const projectId = searchParams.get('projectId') ?? '';
        const workflowParam = searchParams.get('workflow');
        setSelectedProjectId(projectId);
        if (workflowParam === 'all' || workflowParam === 'direct' || workflowParam === 'supplier') {
            setWorkflow(workflowParam);
        } else {
            setWorkflow('all');
        }
    }, [searchParams]);

    useEffect(() => {
        if (!selectedProjectId) return;
        if (projects.some((project) => project.id === selectedProjectId)) return;
        setSelectedProjectId('');
    }, [projects, selectedProjectId]);

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        if (selectedProjectId) next.set('projectId', selectedProjectId);
        else next.delete('projectId');
        next.set('workflow', workflow);
        setSearchParams(next, { replace: true });
    }, [selectedProjectId, workflow]);

    useEffect(() => {
        let active = true;
        const loadSupplierContacts = async () => {
            const contacts = await listParties(undefined, 'supplier', '', { activeOnly: true });
            if (!active) return;
            setAvailableSupplierContacts(contacts.filter((party) => party.isSupplier && party.isActive));
        };
        void loadSupplierContacts();
        return () => { active = false; };
    }, [company?.companyId, workflow]);

    const supplierExpenses = useMemo(() => expenses.filter((expense) => expense.expenseType === 'supplier_bill'), [expenses]);
    const directExpenses = useMemo(() => expenses.filter((expense) => expense.expenseType === 'direct'), [expenses]);
    const visibleExpenses = useMemo(() => {
        const rows = workflow === 'supplier' ? supplierExpenses : workflow === 'direct' ? directExpenses : expenses;
        const projectScopedRows = selectedProjectId ? rows.filter((expense) => expense.projectId === selectedProjectId) : rows;
        return showVoided ? projectScopedRows : projectScopedRows.filter((expense) => expense.status !== 'void');
    }, [workflow, supplierExpenses, directExpenses, expenses, showVoided, selectedProjectId]);

    const totals = useMemo(() => {
        const rows = visibleExpenses.filter((expense) => expense.status !== 'void');
        const totalBilled = rows.reduce((sum, expense) => sum + Number(expense.billAmount ?? 0), 0);
        const totalPaid = rows.reduce((sum, expense) => sum + getPaidAmount(expense), 0);
        const totalOutstanding = rows.reduce((sum, expense) => sum + getOutstandingAmount(expense), 0);
        return { totalBilled, totalPaid, totalOutstanding };
    }, [visibleExpenses, paymentsByExpenseId]);

    const selectedExpense = useMemo(
        () => expenses.find((expense) => expense.id === paymentDialogExpenseId) ?? null,
        [expenses, paymentDialogExpenseId]
    );

    const selectedExpensePaidAmount = selectedExpense ? getPaidAmount(selectedExpense) : 0;
    const selectedExpenseOutstandingAmount = selectedExpense ? getOutstandingAmount(selectedExpense) : 0;

    const openCreateModal = () => {
        setEditingId(null);
        setSelectedSupplierContactId('');
        setForm({
            ...emptyForm,
            projectId: selectedProjectId || (projects[0]?.id ?? ''),
            expenseType: workflow === 'supplier' ? 'supplier_bill' : 'direct',
            category: workflow === 'supplier' ? 'Materials' : 'Labour',
        });
        setStatusAtModalOpen('unpaid');
        setModalOpen(true);
    };

    const openEditModal = (expense: ProjectExpenseRecord) => {
        setEditingId(expense.id);
        setStatusAtModalOpen(expense.status);
        const activeSupplierId = expense.supplierPartyId ?? '';
        setSelectedSupplierContactId(activeSupplierId);
        setForm({
            projectId: expense.projectId,
            expenseType: expense.expenseType,
            category: expense.category,
            description: expense.description,
            supplierPartyId: activeSupplierId,
            supplierName: expense.supplierName ?? '',
            supplierBillNumber: expense.supplierBillNumber ?? '',
            billDate: expense.billDate ?? '',
            dueDate: expense.dueDate ?? '',
            billAmount: String(expense.billAmount ?? 0),
            status: expense.status,
            visibilityStatus: expense.visibilityStatus,
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const isSupplierExpense = form.expenseType === 'supplier_bill';
        if (!company) {
            push('error', 'Please select your company before saving expenses.');
            return;
        }
        if (!form.projectId) {
            push('error', 'Select a project before continuing.');
            return;
        }
        if (!form.category.trim()) {
            push('error', 'Select or enter an expense category.');
            return;
        }
        if (!form.description.trim()) {
            push('error', isSupplierExpense ? 'Enter a supplier bill description.' : 'Enter an expense description.');
            return;
        }
        if (Number(form.billAmount || 0) <= 0) {
            push('error', 'Enter a bill amount greater than zero.');
            return;
        }
        if (!isValidDateInput(form.billDate)) {
            push('error', 'Select a valid bill date.');
            return;
        }
        if (!isValidDateInput(form.dueDate)) {
            push('error', 'Select a valid due date.');
            return;
        }

        if (
            isSupplierExpense
            && (form.status === 'paid' || form.status === 'partially_paid')
            && form.status !== statusAtModalOpen
        ) {
            push('error', 'Use Record Payment to mark bills as paid or partially paid.');
            return;
        }

        const billAmount = Number(form.billAmount || 0);

        setSaving(true);
        const payload = {
            projectId: form.projectId,
            expenseType: form.expenseType,
            categoryId: expenseCategories.find((item) => item.name === form.category || item.id === form.category)?.id ?? null,
            category: form.category,
            description: form.description,
            supplierPartyId: isSupplierExpense ? (selectedSupplierContactId || form.supplierPartyId || null) : null,
            supplierName: form.supplierName || null,
            supplierBillNumber: form.supplierBillNumber || null,
            billDate: form.billDate || null,
            dueDate: form.dueDate || null,
            billAmount,
            status: form.status,
            visibilityStatus: form.visibilityStatus,
        };

        try {
            const result = editingId
                ? await updateProjectExpenseResult(editingId, payload)
                : await createProjectExpenseResult(payload);

            if (!result.ok) {
                push('error', result.error || (isSupplierExpense
                    ? 'We could not save this supplier bill right now. Please try again.'
                    : 'We could not save this expense right now. Please try again.'));
                return;
            }

            push('success', editingId
                ? (isSupplierExpense ? 'Supplier bill updated successfully.' : 'Expense updated successfully.')
                : (isSupplierExpense ? 'Supplier bill created successfully.' : 'Expense created successfully.'));

            setModalOpen(false);
            setForm({ ...emptyForm, projectId: projects[0]?.id ?? '' });
            setEditingId(null);
            setStatusAtModalOpen('unpaid');
            await refresh();
        } catch (error) {
            console.error(error);
            push('error', isSupplierExpense
                ? 'We could not save this supplier bill right now. Please try again.'
                : 'We could not save this expense right now. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        let ok = await deleteProjectExpense(deleteId);
        if (!ok) {
            // Fallback for environments where DELETE may be blocked/intercepted.
            const patched = await updateProjectExpense(deleteId, { status: 'void' });
            ok = Boolean(patched);
        }

        setDeleteId(null);
        if (ok) {
            await refresh();
            push('success', workflow === 'supplier' ? 'Supplier bill has been voided.' : 'Expense has been voided.');
        } else {
            push('error', workflow === 'supplier' ? 'Unable to void this supplier bill right now. Please try again.' : 'Unable to void this expense right now. Please try again.');
        }
    };

    const openRecordPaymentDialog = (expense: ProjectExpenseRecord) => {
        const defaultMethod = paymentMethods[0];
        setPaymentDialogExpenseId(expense.id);
        setPaymentForm({
            amount: '',
            paymentDate: toIsoDate(new Date()),
            paymentMethodId: defaultMethod?.id ?? '',
            paymentMethod: defaultMethod?.code === 'bank_transfer' || defaultMethod?.code === 'upi' || defaultMethod?.code === 'cheque' || defaultMethod?.code === 'other' || defaultMethod?.code === 'cash'
                ? defaultMethod.code
                : 'cash',
            referenceNumber: '',
            notes: '',
        });
    };

    const closeRecordPaymentDialog = () => {
        setPaymentDialogExpenseId(null);
        setPaymentForm({ ...emptyPaymentForm });
    };

    const handleSavePayment = async () => {
        if (!selectedExpense) {
            push('error', 'Please choose a supplier bill first.');
            return;
        }
        if (selectedExpense.status === 'void') {
            push('error', 'Payments cannot be recorded for a void bill.');
            return;
        }
        if (selectedExpenseOutstandingAmount <= 0) {
            push('error', 'This bill has no balance due.');
            return;
        }

        const amount = Number(paymentForm.amount || 0);
        if (amount <= 0) {
            push('error', 'Enter a valid payment amount.');
            return;
        }
        if (amount > selectedExpenseOutstandingAmount) {
            push('error', `Amount cannot exceed the current balance due of ${formatCurrency(selectedExpenseOutstandingAmount)}.`);
            return;
        }
        if (paymentSaving) return;

        setPaymentSaving(true);
        try {
            const result = await createProjectExpensePaymentResult({
                projectExpenseId: selectedExpense.id,
                amount,
                paymentDate: paymentForm.paymentDate || toIsoDate(new Date()),
                paymentMethodId: paymentForm.paymentMethodId || null,
                paymentMethod: paymentForm.paymentMethod,
                referenceNumber: paymentForm.referenceNumber || null,
                notes: paymentForm.notes || null,
            });

            if (!result.ok) {
                push('error', result.error || 'We could not record this supplier payment right now. Please try again.');
                return;
            }

            push('success', 'Supplier payment added successfully.');
            await refresh();
            closeRecordPaymentDialog();
        } catch (error) {
            console.error(error);
            push('error', 'We could not record this supplier payment right now. Please try again.');
        } finally {
            setPaymentSaving(false);
        }
    };

    const summaryTitle = workflow === 'supplier' ? 'Supplier Bills' : workflow === 'direct' ? 'Direct Expenses' : 'All Expenses';
    const summaryDescription = workflow === 'supplier'
        ? 'Track supplier bills, payments, and balance due from real payment records.'
        : workflow === 'direct'
            ? 'Track day-to-day project expenses without supplier-bill specific fields.'
            : 'View all project expenses in one place across direct and supplier records.';

    const showExpenseDateColumn = workflow !== 'supplier' && visibleExpenses.some((expense) => Boolean(expense.billDate));
    const modalIsSupplier = form.expenseType === 'supplier_bill';

    return (
        <div className="space-y-6">
            <PageHeader
                title={summaryTitle}
                actions={
                    <>
                        <AppButton variant="secondary">
                            <ArrowUpRight className="h-4 w-4" />
                            Export CSV
                        </AppButton>
                        <AppButton variant="secondary">
                            <FileText className="h-4 w-4" />
                            Import CSV
                        </AppButton>
                        <AppButton onClick={openCreateModal}>
                            <Plus className="h-4 w-4" />
                            {workflow === 'supplier' ? 'Add Supplier Bill' : 'Add Expense'}
                        </AppButton>
                    </>
                }
            />

            <p className="text-sm text-[#667085]">{summaryDescription}</p>

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                    type="button"
                    onClick={() => setWorkflow('all')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${workflow === 'all' ? 'bg-[#1D4ED8] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    All Expenses
                </button>
                <button
                    type="button"
                    onClick={() => setWorkflow('direct')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${workflow === 'direct' ? 'bg-[#1D4ED8] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Direct Expenses
                </button>
                <button
                    type="button"
                    onClick={() => setWorkflow('supplier')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${workflow === 'supplier' ? 'bg-[#1D4ED8] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Supplier Bills
                </button>
            </div>

            <PremiumCard className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <label className="block flex-1">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#667085]">Project filter</span>
                        <select
                            value={selectedProjectId}
                            onChange={(event) => setSelectedProjectId(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]"
                        >
                            <option value="">All projects</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </label>
                    <div className="flex items-center gap-2">
                        {selectedProjectId ? (
                            <button
                                type="button"
                                onClick={() => setSelectedProjectId('')}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Clear filter
                            </button>
                        ) : null}
                    </div>
                </div>
            </PremiumCard>

            <div className="grid gap-4 md:grid-cols-3">
                <PremiumCard className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#667085]">{workflow === 'supplier' ? 'Billed' : 'Total Expenses'}</p>
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-3xl font-semibold text-[#17243A]">{formatCurrency(totals.totalBilled)}</p>
                        <WalletCards className="h-10 w-10 rounded-xl bg-[#EAF1FF] p-2 text-[#1D4ED8]" />
                    </div>
                    <p className="mt-2 text-sm text-[#667085]">{workflow === 'supplier' ? 'Active supplier bill value across projects.' : workflow === 'direct' ? 'Direct expense value recorded across projects.' : 'Combined expense value across all record types.'}</p>
                </PremiumCard>

                <PremiumCard className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#667085]">Paid</p>
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-3xl font-semibold text-[#17243A]">{formatCurrency(totals.totalPaid)}</p>
                        <TrendingUp className="h-10 w-10 rounded-xl bg-[#ECFDF5] p-2 text-[#0F766E]" />
                    </div>
                    <p className="mt-2 text-sm text-[#667085]">Settled using actual recorded payment transactions.</p>
                </PremiumCard>

                <PremiumCard className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#667085]">{workflow === 'supplier' ? 'Outstanding' : 'Balance Due'}</p>
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-3xl font-semibold text-[#17243A]">{formatCurrency(totals.totalOutstanding)}</p>
                        <CreditCard className="h-10 w-10 rounded-xl bg-[#EEF4FF] p-2 text-[#1D4ED8]" />
                    </div>
                    <p className="mt-2 text-sm text-[#667085]">Pending amount after excluding voided records.</p>
                </PremiumCard>
            </div>

            <PremiumCard className="overflow-hidden">
                <div className="border-b border-[#E6E8EC] px-5 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-base font-semibold text-[#17243A]">{workflow === 'supplier' ? 'Supplier Bills' : workflow === 'direct' ? 'Direct Expenses' : 'All Expenses'}</p>
                            <p className="mt-1 text-sm text-[#667085]">{workflow === 'supplier' ? 'One bill ledger table with payment actions in bill context.' : workflow === 'direct' ? 'One expense ledger table for daily project expenses.' : 'One combined expense ledger table across direct and supplier records.'}</p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm text-[#344054]">
                            <input
                                type="checkbox"
                                checked={showVoided}
                                onChange={(event) => setShowVoided(event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
                            />
                            Show voided records
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-[#1D4ED8]" />
                            <span>Loading records…</span>
                        </div>
                    </div>
                ) : visibleExpenses.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                        {workflow === 'supplier' ? 'No supplier bills added yet.' : workflow === 'direct' ? 'No direct expenses added yet.' : 'No expenses added yet.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-[#667085]">
                                {workflow === 'supplier' ? (
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Project</th>
                                        <th className="px-5 py-3 font-medium">Supplier</th>
                                        <th className="px-5 py-3 font-medium">Bill No.</th>
                                        <th className="px-5 py-3 font-medium">Bill Date</th>
                                        <th className="px-5 py-3 font-medium">Due Date</th>
                                        <th className="px-5 py-3 font-medium">Bill Amount</th>
                                        <th className="px-5 py-3 font-medium">Paid</th>
                                        <th className="px-5 py-3 font-medium">Balance Due</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Project</th>
                                        {workflow === 'all' && <th className="px-5 py-3 font-medium">Type</th>}
                                        {workflow === 'all' && <th className="px-5 py-3 font-medium">Supplier</th>}
                                        <th className="px-5 py-3 font-medium">Expense Category</th>
                                        <th className="px-5 py-3 font-medium">Description</th>
                                        {showExpenseDateColumn && <th className="px-5 py-3 font-medium">Expense Date</th>}
                                        <th className="px-5 py-3 font-medium">Amount</th>
                                        <th className="px-5 py-3 font-medium">Payment Status</th>
                                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {visibleExpenses.map((expense) => {
                                    const paidAmount = getPaidAmount(expense);
                                    const outstanding = getOutstandingAmount(expense);
                                    const canRecordPayment = workflow === 'supplier' && expense.status !== 'void' && outstanding > 0;
                                    return (
                                        <tr key={expense.id}>
                                            {workflow === 'supplier' ? (
                                                <>
                                                    <td className="px-5 py-4 text-[#17243A]">{expense.projectName || expense.projectNumber || 'Project'}</td>
                                                    <td className="px-5 py-4 text-[#17243A]">{expense.supplierName || '—'}</td>
                                                    <td className="px-5 py-4 text-[#344054]">{expense.supplierBillNumber || '—'}</td>
                                                    <td className="px-5 py-4 text-[#344054]">{expense.billDate || '—'}</td>
                                                    <td className="px-5 py-4 text-[#344054]">{expense.dueDate || '—'}</td>
                                                    <td className="px-5 py-4 font-medium text-[#17243A]">{formatCurrency(expense.billAmount)}</td>
                                                    <td className="px-5 py-4 font-medium text-[#17243A]">{formatCurrency(paidAmount)}</td>
                                                    <td className="px-5 py-4 font-medium text-[#17243A]">{formatCurrency(outstanding)}</td>
                                                    <td className="px-5 py-4">
                                                        <StatusPill
                                                            label={expense.status === 'paid' ? 'Paid' : expense.status === 'partially_paid' ? 'Partially paid' : expense.status === 'void' ? 'Void' : 'Unpaid'}
                                                            tone={expense.status === 'paid' ? 'success' : expense.status === 'partially_paid' ? 'warning' : expense.status === 'void' ? 'neutral' : 'info'}
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                className="inline-flex items-center gap-1 rounded-lg border border-[#1D4ED8]/20 px-2.5 py-2 text-xs font-medium text-[#1D4ED8] hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-50"
                                                                onClick={() => openRecordPaymentDialog(expense)}
                                                                disabled={!canRecordPayment}
                                                                aria-label="Record payment"
                                                                title={expense.status === 'void' ? 'Payments are disabled for void bills' : 'Record payment and view transactions'}
                                                            >
                                                                <CreditCard className="h-3.5 w-3.5" />
                                                                Record Payment
                                                            </button>
                                                            <button className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" onClick={() => openEditModal(expense)} aria-label="Edit supplier bill" title="Edit supplier bill">
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                onClick={() => setDeleteId(expense.id)}
                                                                aria-label="Void supplier bill"
                                                                title={expense.status === 'void' ? 'This bill is already void' : 'Void supplier bill'}
                                                                disabled={expense.status === 'void'}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-5 py-4 text-[#17243A]">{expense.projectName || expense.projectNumber || 'Project'}</td>
                                                    {workflow === 'all' && (
                                                        <td className="px-5 py-4">
                                                            <StatusPill
                                                                label={expense.expenseType === 'supplier_bill' ? 'Supplier bill' : 'Direct'}
                                                                tone={expense.expenseType === 'supplier_bill' ? 'warning' : 'info'}
                                                            />
                                                        </td>
                                                    )}
                                                    {workflow === 'all' && <td className="px-5 py-4 text-[#344054]">{expense.supplierName || '—'}</td>}
                                                    <td className="px-5 py-4 text-[#344054]">{expense.category}</td>
                                                    <td className="px-5 py-4 text-[#344054]">{expense.description || '—'}</td>
                                                    {showExpenseDateColumn && <td className="px-5 py-4 text-[#344054]">{expense.billDate || '—'}</td>}
                                                    <td className="px-5 py-4 font-medium text-[#17243A]">{formatCurrency(expense.billAmount)}</td>
                                                    <td className="px-5 py-4">
                                                        <StatusPill
                                                            label={expense.status === 'paid' ? 'Paid' : expense.status === 'partially_paid' ? 'Partially paid' : expense.status === 'void' ? 'Void' : 'Unpaid'}
                                                            tone={expense.status === 'paid' ? 'success' : expense.status === 'partially_paid' ? 'warning' : expense.status === 'void' ? 'neutral' : 'info'}
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <button className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" onClick={() => openEditModal(expense)} aria-label="Edit expense" title="Edit expense">
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                onClick={() => setDeleteId(expense.id)}
                                                                aria-label="Void expense"
                                                                title={expense.status === 'void' ? 'This expense is already void' : 'Void expense'}
                                                                disabled={expense.status === 'void'}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Expense" title={editingId ? (modalIsSupplier ? 'Edit supplier bill' : 'Edit expense') : (modalIsSupplier ? 'Add supplier bill' : 'Add expense')} onClose={() => setModalOpen(false)} size="xl">
                    <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Project <span className="text-red-600">*</span></span>
                                <select value={form.projectId} onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none ring-0 focus:border-[#1D4ED8]">
                                    <option value="">Select project</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Expense Type <span className="text-red-600">*</span></span>
                                <select
                                    value={form.expenseType}
                                    onChange={(event) => setForm((prev) => ({ ...prev, expenseType: event.target.value as ProjectExpenseType }))}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]"
                                >
                                    <option value="direct">Direct Expense</option>
                                    <option value="supplier_bill">Supplier Bill</option>
                                </select>
                            </label>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">{modalIsSupplier ? 'Expense Category' : 'Category'} <span className="text-red-600">*</span></span>
                                <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]">
                                    {expenseCategories.length === 0 ? (
                                        <option value={form.category}>{form.category}</option>
                                    ) : (
                                        expenseCategories.map((category) => (
                                            <option key={category.id} value={category.name}>{category.name}</option>
                                        ))
                                    )}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">{modalIsSupplier ? 'Bill Amount' : 'Amount'} <span className="text-red-600">*</span></span>
                                <input type="number" min="0" step="0.01" value={form.billAmount} onChange={(event) => setForm((prev) => ({ ...prev, billAmount: event.target.value }))} placeholder="Example: 45000" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Payment status</span>
                                <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as any }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none ring-0 focus:border-[#1D4ED8]">
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partially_paid">Partially paid</option>
                                    <option value="paid">Paid</option>
                                    <option value="void">Void</option>
                                </select>
                                {modalIsSupplier && (
                                    <p className="mt-1 text-xs text-[#667085]">Use Record Payment in the bills table to capture paid amount and update this status automatically.</p>
                                )}
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">{modalIsSupplier ? 'Bill date' : 'Expense date'}</span>
                                <input type="date" value={form.billDate} onChange={(event) => setForm((prev) => ({ ...prev, billDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" />
                            </label>

                            {form.expenseType === 'direct' && (
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-[#344054]">Invoice / bill no.</span>
                                    <input value={form.supplierBillNumber} onChange={(event) => setForm((prev) => ({ ...prev, supplierBillNumber: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" />
                                    <span className="mt-1 block text-xs text-[#667085]">Optional reference number for this expense.</span>
                                </label>
                            )}

                            {form.expenseType === 'supplier_bill' && (
                                <>
                                    <label className="block md:col-span-2">
                                        <span className="mb-1.5 block text-sm font-medium text-[#344054]">Supplier</span>
                                        <select
                                            value={selectedSupplierContactId}
                                            onChange={(event) => {
                                                const nextValue = event.target.value;
                                                setSelectedSupplierContactId(nextValue);
                                                const selectedContact = availableSupplierContacts.find((party) => party.id === nextValue);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    supplierPartyId: nextValue,
                                                    supplierName: selectedContact?.name ?? prev.supplierName,
                                                }));
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]"
                                        >
                                            <option value="">Select supplier contact</option>
                                            {availableSupplierContacts.map((party) => (
                                                <option key={party.id} value={party.id}>{party.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-[#344054]">Supplier name</span>
                                        <input value={form.supplierName} onChange={(event) => setForm((prev) => ({ ...prev, supplierName: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-[#344054]">Supplier invoice / bill no.</span>
                                        <input value={form.supplierBillNumber} onChange={(event) => setForm((prev) => ({ ...prev, supplierBillNumber: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" />
                                        <span className="mt-1 block text-xs text-[#667085]">Use the supplier’s actual invoice or bill number, not a project internal reference.</span>
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-[#344054]">Due date</span>
                                        <input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" />
                                    </label>
                                </>
                            )}

                            <label className="block md:col-span-2">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Description <span className="text-red-600">*</span></span>
                                <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={2} placeholder="Example: Steel bars for 2nd floor columns" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" />
                            </label>
                        </div>

                        <div className="mt-2 flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>
                                Cancel
                            </AppButton>
                            <AppButton onClick={handleSubmit} disabled={saving}>
                                {saving ? 'Saving…' : editingId ? (modalIsSupplier ? 'Update bill' : 'Update expense') : (modalIsSupplier ? 'Save bill' : 'Save expense')}
                            </AppButton>
                        </div>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title={workflow === 'supplier' ? 'Void supplier bill?' : 'Void expense?'}
                message={workflow === 'supplier'
                    ? 'This will mark the bill as void in the project ledger. It will remain in the history but will no longer count as active spend.'
                    : 'This will mark the expense as void in the project ledger. It will remain in the history but will no longer count as active spend.'}
                danger
                confirmLabel={workflow === 'supplier' ? 'Void supplier bill' : 'Void expense'}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            {selectedExpense && (
                <Modal eyebrow="Supplier payment" title="Record Payment" onClose={closeRecordPaymentDialog} size="xl">
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[#E6E8EC] bg-slate-50/70 p-4">
                            <p className="text-sm font-semibold text-[#17243A]">Selected bill</p>
                            <div className="mt-3 grid gap-3 text-sm text-[#344054] md:grid-cols-2">
                                <p><span className="font-medium text-[#17243A]">Project:</span> {selectedExpense.projectName || selectedExpense.projectNumber || 'Project'}</p>
                                <p><span className="font-medium text-[#17243A]">Counterparty:</span> {selectedExpense.supplierName || 'Direct expense / no supplier record'}</p>
                                {selectedExpense.supplierBillNumber ? (
                                    <p><span className="font-medium text-[#17243A]">Supplier invoice / bill no.:</span> {selectedExpense.supplierBillNumber}</p>
                                ) : null}
                                <p><span className="font-medium text-[#17243A]">Bill amount:</span> {formatCurrency(selectedExpense.billAmount)}</p>
                                <p><span className="font-medium text-[#17243A]">Amount already paid:</span> {formatCurrency(selectedExpensePaidAmount)}</p>
                                <p><span className="font-medium text-[#17243A]">Balance due:</span> {formatCurrency(selectedExpenseOutstandingAmount)}</p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="block">
                                <span className="mb-1 block text-xs text-[#667085]">Amount to Pay</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs text-[#667085]">Payment Date</span>
                                <input
                                    type="date"
                                    value={paymentForm.paymentDate}
                                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs text-[#667085]">Payment Mode</span>
                                <select
                                    value={paymentForm.paymentMethodId || paymentForm.paymentMethod}
                                    onChange={(event) => {
                                        const selected = paymentMethods.find((method) => method.id === event.target.value);
                                        setPaymentForm((prev) => ({
                                            ...prev,
                                            paymentMethodId: selected?.id ?? '',
                                            paymentMethod: selected?.code === 'bank_transfer' || selected?.code === 'upi' || selected?.code === 'cheque' || selected?.code === 'other' || selected?.code === 'cash'
                                                ? (selected.code as any)
                                                : prev.paymentMethod,
                                        }));
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]"
                                >
                                    {paymentMethods.length === 0 ? (
                                        <>
                                            <option value="cash">Cash</option>
                                            <option value="upi">UPI</option>
                                            <option value="bank_transfer">Bank transfer</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="other">Other</option>
                                        </>
                                    ) : (
                                        paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)
                                    )}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs text-[#667085]">UPI / Transaction Reference No. (optional)</span>
                                <input
                                    value={paymentForm.referenceNumber}
                                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, referenceNumber: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]"
                                />
                            </label>
                            <label className="block md:col-span-2">
                                <span className="mb-1 block text-xs text-[#667085]">Notes (optional)</span>
                                <textarea
                                    rows={2}
                                    value={paymentForm.notes}
                                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]"
                                />
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <AppButton variant="secondary" onClick={closeRecordPaymentDialog}>Cancel</AppButton>
                            <AppButton onClick={handleSavePayment} disabled={paymentSaving || selectedExpense.status === 'void'}>
                                {paymentSaving ? 'Recording…' : 'Record Payment'}
                            </AppButton>
                        </div>
                        <p className="text-xs text-[#667085]">Payment transactions can be reviewed from the supplier bills table context.</p>
                    </div>
                </Modal>
            )}
        </div>
    );
}
