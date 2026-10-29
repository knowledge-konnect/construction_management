import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, EmptyState, Modal, PremiumCard, StatusPill } from '@/components/ui/DesignSystem';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatINR } from '@/lib/utils';
import type { ProjectRecord } from '@/services/project.service';
import {
    createInvestorContribution,
    createProjectAttachment,
    createProjectClientAccess,
    createProjectExpense,
    createProjectInvestor,
    createProjectProgressUpdate,
    createProjectReceipt,
    createProjectStage,
    deleteInvestorContribution,
    deleteProjectAttachment,
    deleteProjectExpense,
    deleteProjectInvestor,
    deleteProjectProgressUpdate,
    deleteProjectReceipt,
    deleteProjectStage,
    listInvestorContributions,
    listProjectAttachments,
    listProjectClientAccess,
    listProjectExpenses,
    listProjectInvestors,
    listProjectProgressUpdates,
    listProjectReceipts,
    listProjectStages,
    revokeProjectClientAccess,
    updateInvestorContribution,
    updateProjectExpense,
    updateProjectInvestor,
    updateProjectProgressUpdate,
    updateProjectReceipt,
    updateProjectStage,
    type InvestorContributionRecord,
    type ProjectAttachmentRecord,
    type ProjectClientAccessRecord,
    type ProjectExpenseRecord,
    type ProjectExpenseStatus,
    type ProjectInvestorRecord,
    type ProjectProgressUpdateRecord,
    type ProjectProgressVisibility,
    type ProjectReceiptPaymentMethod,
    type ProjectReceiptRecord,
    type ProjectStageRecord,
    type ProjectStageStatus,
} from '@/services/projectCost.service';
import { CalendarClock, FileText, FolderKanban, Link2, MapPin, MessageCircle, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const stageStatuses: ProjectStageStatus[] = ['pending', 'in_progress', 'completed', 'on_hold'];
const progressVisibilityStatuses: ProjectProgressVisibility[] = ['draft', 'published'];
const expenseStatuses: ProjectExpenseStatus[] = ['unpaid', 'partially_paid', 'paid', 'void'];
const receiptMethods: ProjectReceiptPaymentMethod[] = ['cash', 'upi', 'bank_transfer', 'cheque', 'other'];

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]';
const labelClass = 'mb-1.5 block text-sm font-medium text-[#344054]';
const tableEditButtonClass = '!px-2.5 !py-1.5 !bg-slate-100 hover:!bg-slate-200 !border !border-slate-200';
const tableDeleteButtonClass = '!px-2.5 !py-1.5 !bg-red-100 hover:!bg-red-200 !border !border-red-200';

const asInputDate = (value?: string | null) => (value ? value.slice(0, 10) : '');

const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return parseNumber(trimmed);
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className={labelClass}>{label}{required ? <span className="text-red-600"> *</span> : null}</span>
            {children}
        </label>
    );
}

export const projectTabs = [
    'Overview',
    'Stages',
    'Site Updates',
    'Expenses',
    'Payments Received',
    'Documents',
    'Customer Access',
    'Investors',
] as const;

export type ProjectTab = (typeof projectTabs)[number];

export function ProjectOverviewPanel({ project }: { project: ProjectRecord }) {
    const progress = project.status === 'completed' ? 100 : project.status === 'in_progress' ? 65 : project.status === 'on_hold' ? 45 : 20;
    const metrics = [
        { label: 'Contract value', value: formatINR(Number(project.contractAmount ?? 0)) },
        { label: 'Physical progress', value: `${progress}%` },
        { label: 'Customer', value: project.customer?.name || 'Pending' },
        { label: 'Status', value: project.status },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                {metrics.map((item) => (
                    <PremiumCard key={item.label} className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#667085]">{item.label}</p>
                        <p className="mt-4 text-xl font-semibold text-[#17243A]">{item.value}</p>
                    </PremiumCard>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <PremiumCard className="p-5">
                    <p className="text-base font-semibold text-[#17243A]">Project summary</p>
                    <p className="mt-3 text-sm text-[#667085]">{project.description || 'No project description has been added yet.'}</p>
                </PremiumCard>

                <PremiumCard className="p-5">
                    <p className="text-base font-semibold text-[#17243A]">Project details</p>
                    <div className="mt-4 space-y-3 text-sm text-[#344054]">
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#667085]" /> {project.siteAddress || 'Site address pending'}</div>
                        <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#667085]" /> Start: {project.startDate ? formatDate(project.startDate) : 'Pending'}</div>
                        <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#667085]" /> Planned finish: {project.expectedEndDate ? formatDate(project.expectedEndDate) : 'Pending'}</div>
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}

export function ProjectStagePanel({ projectId }: { projectId: string }) {
    const [stages, setStages] = useState<ProjectStageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectStageRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        sequenceNumber: '1',
        status: 'pending' as ProjectStageStatus,
        completionPercentage: '0',
        plannedStartDate: '',
        plannedEndDate: '',
    });
    const { push } = useToast();

    const loadStages = async () => {
        setLoading(true);
        setStages(await listProjectStages(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadStages();
    }, [projectId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', sequenceNumber: String(stages.length + 1), status: 'pending', completionPercentage: '0', plannedStartDate: '', plannedEndDate: '' });
        setModalOpen(true);
    };

    const openEdit = (stage: ProjectStageRecord) => {
        setEditing(stage);
        setForm({
            name: stage.name,
            sequenceNumber: String(stage.sequenceNumber),
            status: stage.status,
            completionPercentage: String(stage.completionPercentage),
            plannedStartDate: asInputDate(stage.plannedStartDate),
            plannedEndDate: asInputDate(stage.plannedEndDate),
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim()) {
            push('error', 'Stage name is required.');
            return;
        }
        const sequenceNumber = parseNumber(form.sequenceNumber);
        const completionPercentage = parseNumber(form.completionPercentage);
        if (!sequenceNumber || sequenceNumber <= 0) {
            push('error', 'Sequence number must be greater than 0.');
            return;
        }
        if (completionPercentage === null || completionPercentage < 0 || completionPercentage > 100) {
            push('error', 'Completion must be between 0 and 100.');
            return;
        }

        setSaving(true);
        const payload = {
            name: form.name.trim(),
            sequenceNumber,
            status: form.status,
            completionPercentage,
            plannedStartDate: form.plannedStartDate || null,
            plannedEndDate: form.plannedEndDate || null,
        };

        const result = editing
            ? await updateProjectStage(editing.id, payload)
            : await createProjectStage({ projectId, ...payload });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update stage.' : 'Could not create stage.');
            return;
        }

        push('success', editing ? 'Stage updated.' : 'Stage created.');
        setModalOpen(false);
        await loadStages();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectStage(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete stage.');
            return;
        }
        push('success', 'Stage deleted.');
        await loadStages();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading project stages...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Project stages</p>
                        <p className="mt-1 text-sm text-[#667085]">Track the project lifecycle across physical milestones.</p>
                    </div>
                    <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add stage</AppButton>
                </div>

                {stages.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<FolderKanban className="h-5 w-5" />} title="No stages created yet" description="Add project milestones as the work sequence is defined." /></div>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3">Stage</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Schedule</th>
                                    <th className="px-4 py-3">Progress</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {stages.map((stage) => (
                                    <tr key={stage.id}>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{stage.name}</td>
                                        <td className="px-4 py-3"><StatusPill label={stage.status} tone={stage.status === 'completed' ? 'success' : stage.status === 'in_progress' ? 'info' : stage.status === 'on_hold' ? 'warning' : 'neutral'} /></td>
                                        <td className="px-4 py-3 text-[#344054]">{stage.plannedStartDate ? formatDate(stage.plannedStartDate) : '-'}{' -> '}{stage.plannedEndDate ? formatDate(stage.plannedEndDate) : '-'}</td>
                                        <td className="px-4 py-3 text-[#344054]">{stage.completionPercentage}%</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(stage)}><Pencil className="h-4 w-4" /></AppButton>
                                                <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(stage.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Stage" title={editing ? 'Edit stage' : 'Add stage'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Stage name" required>
                                <input className={inputClass} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                            </Field>
                            <Field label="Sequence" required>
                                <input type="number" min="1" className={inputClass} value={form.sequenceNumber} onChange={(event) => setForm((prev) => ({ ...prev, sequenceNumber: event.target.value }))} />
                            </Field>
                            <Field label="Status">
                                <select className={inputClass} value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ProjectStageStatus }))}>
                                    {stageStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <Field label="Completion %" required>
                                <input type="number" min="0" max="100" className={inputClass} value={form.completionPercentage} onChange={(event) => setForm((prev) => ({ ...prev, completionPercentage: event.target.value }))} />
                            </Field>
                            <Field label="Planned start">
                                <input type="date" className={inputClass} value={form.plannedStartDate} onChange={(event) => setForm((prev) => ({ ...prev, plannedStartDate: event.target.value }))} />
                            </Field>
                            <Field label="Planned end">
                                <input type="date" className={inputClass} value={form.plannedEndDate} onChange={(event) => setForm((prev) => ({ ...prev, plannedEndDate: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add stage'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete stage?"
                message="This removes the selected stage from the project timeline."
                danger
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectProgressPanel({ projectId }: { projectId: string }) {
    const [updates, setUpdates] = useState<ProjectProgressUpdateRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectProgressUpdateRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        progressPercentage: '',
        visibilityStatus: 'draft' as ProjectProgressVisibility,
        updateDate: '',
    });
    const { push } = useToast();

    const loadUpdates = async () => {
        setLoading(true);
        setUpdates(await listProjectProgressUpdates(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadUpdates();
    }, [projectId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ title: '', description: '', progressPercentage: '', visibilityStatus: 'draft', updateDate: '' });
        setModalOpen(true);
    };

    const openEdit = (update: ProjectProgressUpdateRecord) => {
        setEditing(update);
        setForm({
            title: update.title,
            description: update.description || '',
            progressPercentage: update.progressPercentage !== null && update.progressPercentage !== undefined ? String(update.progressPercentage) : '',
            visibilityStatus: update.visibilityStatus,
            updateDate: asInputDate(update.updateDate),
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.title.trim()) {
            push('error', 'Title is required.');
            return;
        }
        const progressPercentage = parseOptionalNumber(form.progressPercentage);
        if (progressPercentage !== null && (progressPercentage < 0 || progressPercentage > 100)) {
            push('error', 'Progress must be between 0 and 100.');
            return;
        }

        setSaving(true);
        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            progressPercentage,
            visibilityStatus: form.visibilityStatus,
            updateDate: form.updateDate || null,
        };

        const result = editing
            ? await updateProjectProgressUpdate(editing.id, payload)
            : await createProjectProgressUpdate({ projectId, ...payload });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update site update.' : 'Could not create site update.');
            return;
        }

        push('success', editing ? 'Site update updated.' : 'Site update created.');
        setModalOpen(false);
        await loadUpdates();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectProgressUpdate(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete site update.');
            return;
        }
        push('success', 'Site update deleted.');
        await loadUpdates();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading site updates...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Site updates</p>
                        <p className="mt-1 text-sm text-[#667085]">Recent progress reports and field observations.</p>
                    </div>
                    <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add update</AppButton>
                </div>

                {updates.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<CalendarClock className="h-5 w-5" />} title="No site updates yet" description="Capture the latest status, delays, and milestone notes for the project." /></div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {updates.map((update) => (
                            <div key={update.id} className="rounded-xl border border-[#E6E8EC] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-semibold text-[#17243A]">{update.title}</p>
                                    <div className="flex items-center gap-2">
                                        <StatusPill label={update.visibilityStatus} tone={update.visibilityStatus === 'published' ? 'success' : 'neutral'} />
                                        <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(update)}><Pencil className="h-4 w-4" /></AppButton>
                                        <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(update.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-[#667085]">{update.description || 'No notes for this update.'}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#667085]">
                                    <span>{update.updateDate ? formatDate(update.updateDate) : 'Date pending'}</span>
                                    <span>{update.progressPercentage !== null && update.progressPercentage !== undefined ? `${update.progressPercentage}% progress` : 'Progress pending'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Site update" title={editing ? 'Edit site update' : 'Add site update'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Title" required>
                                <input className={inputClass} value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                            </Field>
                            <Field label="Progress %">
                                <input type="number" min="0" max="100" className={inputClass} value={form.progressPercentage} onChange={(event) => setForm((prev) => ({ ...prev, progressPercentage: event.target.value }))} />
                            </Field>
                            <Field label="Visibility">
                                <select className={inputClass} value={form.visibilityStatus} onChange={(event) => setForm((prev) => ({ ...prev, visibilityStatus: event.target.value as ProjectProgressVisibility }))}>
                                    {progressVisibilityStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <Field label="Update date">
                                <input type="date" className={inputClass} value={form.updateDate} onChange={(event) => setForm((prev) => ({ ...prev, updateDate: event.target.value }))} />
                            </Field>
                            <Field label="Description" >
                                <textarea className={`${inputClass} min-h-[96px]`} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add update'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete site update?"
                message="This removes the selected site update entry from the project timeline."
                danger
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectExpensePanel({ projectId }: { projectId: string }) {
    const [expenses, setExpenses] = useState<ProjectExpenseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectExpenseRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        supplierName: '',
        category: 'General',
        description: 'Supplier expense',
        billAmount: '',
        status: 'unpaid' as ProjectExpenseStatus,
    });
    const { push } = useToast();

    const loadExpenses = async () => {
        setLoading(true);
        setExpenses(await listProjectExpenses(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadExpenses();
    }, [projectId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ supplierName: '', category: 'General', description: 'Supplier expense', billAmount: '', status: 'unpaid' });
        setModalOpen(true);
    };

    const openEdit = (expense: ProjectExpenseRecord) => {
        setEditing(expense);
        setForm({
            supplierName: expense.supplierName || '',
            category: expense.category || 'General',
            description: expense.description || '',
            billAmount: String(expense.billAmount ?? ''),
            status: expense.status,
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        const billAmount = parseNumber(form.billAmount);
        if (billAmount === null || billAmount <= 0) {
            push('error', 'Bill amount must be greater than 0.');
            return;
        }
        if (!form.category.trim()) {
            push('error', 'Category is required.');
            return;
        }

        setSaving(true);
        const payload = {
            supplierName: form.supplierName.trim() || null,
            category: form.category.trim(),
            description: form.description.trim() || 'Supplier expense',
            billAmount,
            status: form.status,
        };

        const result = editing
            ? await updateProjectExpense(editing.id, payload)
            : await createProjectExpense({ projectId, ...payload });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update expense.' : 'Could not create expense.');
            return;
        }
        push('success', editing ? 'Expense updated.' : 'Expense created.');
        setModalOpen(false);
        await loadExpenses();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectExpense(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete expense.');
            return;
        }
        push('success', 'Expense deleted.');
        await loadExpenses();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading expenses...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Expenses</p>
                        <p className="mt-1 text-sm text-[#667085]">Cost ledger details for supplier bills and internal expenditure.</p>
                    </div>
                    <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add expense</AppButton>
                </div>

                {expenses.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<FileText className="h-5 w-5" />} title="No expenses logged" description="Keep the supplier bills and site expenses tracked against this project." /></div>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3">Supplier</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{expense.supplierName || 'Unassigned'}</td>
                                        <td className="px-4 py-3 text-[#344054]">{expense.category || 'General'}</td>
                                        <td className="px-4 py-3 text-[#17243A]">{formatINR(Number(expense.billAmount ?? 0))}</td>
                                        <td className="px-4 py-3"><StatusPill label={expense.status} tone={expense.status === 'paid' ? 'success' : expense.status === 'partially_paid' ? 'info' : expense.status === 'void' ? 'warning' : 'neutral'} /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(expense)}><Pencil className="h-4 w-4" /></AppButton>
                                                <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(expense.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Expense" title={editing ? 'Edit expense' : 'Add expense'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Supplier">
                                <input className={inputClass} value={form.supplierName} onChange={(event) => setForm((prev) => ({ ...prev, supplierName: event.target.value }))} />
                            </Field>
                            <Field label="Category" required>
                                <input className={inputClass} value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
                            </Field>
                            <Field label="Amount" required>
                                <input type="number" min="0" step="0.01" className={inputClass} value={form.billAmount} onChange={(event) => setForm((prev) => ({ ...prev, billAmount: event.target.value }))} />
                            </Field>
                            <Field label="Status">
                                <select className={inputClass} value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ProjectExpenseStatus }))}>
                                    {expenseStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <Field label="Description">
                                <textarea className={`${inputClass} min-h-[96px]`} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add expense'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete expense?"
                message="This will remove the selected expense record from this project."
                danger
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectReceiptPanel({ projectId, customerMobile, projectName }: { projectId: string; customerMobile?: string | null; projectName?: string }) {
    const [receipts, setReceipts] = useState<ProjectReceiptRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectReceiptRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        receiptNumber: '',
        amount: '',
        paymentMethod: 'cash' as ProjectReceiptPaymentMethod,
        receivedDate: '',
        referenceNumber: '',
        notes: '',
    });
    const { push } = useToast();

    const loadReceipts = async () => {
        setLoading(true);
        setReceipts(await listProjectReceipts(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadReceipts();
    }, [projectId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ receiptNumber: `RCP-${Date.now()}`, amount: '', paymentMethod: 'cash', receivedDate: '', referenceNumber: '', notes: '' });
        setModalOpen(true);
    };

    const openEdit = (receipt: ProjectReceiptRecord) => {
        setEditing(receipt);
        setForm({
            receiptNumber: receipt.receiptNumber,
            amount: String(receipt.amount ?? ''),
            paymentMethod: receipt.paymentMethod,
            receivedDate: asInputDate(receipt.receivedDate),
            referenceNumber: receipt.referenceNumber || '',
            notes: receipt.notes || '',
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        const amount = parseNumber(form.amount);
        if (amount === null || amount <= 0) {
            push('error', 'Amount must be greater than 0.');
            return;
        }
        if (!form.receiptNumber.trim()) {
            push('error', 'Receipt number is required.');
            return;
        }

        setSaving(true);
        const payload = {
            receiptNumber: form.receiptNumber.trim(),
            amount,
            paymentMethod: form.paymentMethod,
            receivedDate: form.receivedDate || null,
            referenceNumber: form.referenceNumber.trim() || null,
            notes: form.notes.trim() || null,
        };

        const result = editing
            ? await updateProjectReceipt(editing.id, payload)
            : await createProjectReceipt({ projectId, ...payload });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update receipt.' : 'Could not create receipt.');
            return;
        }

        push('success', editing ? 'Receipt updated.' : 'Receipt created.');
        setModalOpen(false);
        await loadReceipts();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectReceipt(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete receipt.');
            return;
        }
        push('success', 'Receipt deleted.');
        await loadReceipts();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading payments received...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Payments received</p>
                        <p className="mt-1 text-sm text-[#667085]">Customer receipts and payment references recorded to date.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add receipt</AppButton>
                        {customerMobile ? (
                            <a href={`https://wa.me/${customerMobile}?text=${encodeURIComponent(`Project: ${projectName || 'Project'}\nPayment received summary\nTotal collected: ${formatINR(receipts.reduce((sum, item) => sum + Number(item.amount ?? 0), 0))}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                <MessageCircle className="h-4 w-4" /> Share summary
                            </a>
                        ) : null}
                    </div>
                </div>

                {receipts.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<CalendarClock className="h-5 w-5" />} title="No payments recorded" description="Track customer receipts as they are received against project milestones and instalments." /></div>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3">Receipt</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Method</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {receipts.map((receipt) => (
                                    <tr key={receipt.id}>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{receipt.receiptNumber}</td>
                                        <td className="px-4 py-3 text-[#344054]">{receipt.receivedDate ? formatDate(receipt.receivedDate) : '-'}</td>
                                        <td className="px-4 py-3 text-[#344054]">{receipt.paymentMethod}</td>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{formatINR(Number(receipt.amount ?? 0))}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(receipt)}><Pencil className="h-4 w-4" /></AppButton>
                                                <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(receipt.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Receipt" title={editing ? 'Edit receipt' : 'Add receipt'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Receipt number" required>
                                <input className={inputClass} value={form.receiptNumber} onChange={(event) => setForm((prev) => ({ ...prev, receiptNumber: event.target.value }))} />
                            </Field>
                            <Field label="Amount" required>
                                <input type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
                            </Field>
                            <Field label="Payment method">
                                <select className={inputClass} value={form.paymentMethod} onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value as ProjectReceiptPaymentMethod }))}>
                                    {receiptMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                                </select>
                            </Field>
                            <Field label="Received date">
                                <input type="date" className={inputClass} value={form.receivedDate} onChange={(event) => setForm((prev) => ({ ...prev, receivedDate: event.target.value }))} />
                            </Field>
                            <Field label="Reference number">
                                <input className={inputClass} value={form.referenceNumber} onChange={(event) => setForm((prev) => ({ ...prev, referenceNumber: event.target.value }))} />
                            </Field>
                            <Field label="Notes">
                                <textarea className={`${inputClass} min-h-[96px]`} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add receipt'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete receipt?"
                message="This will remove the selected receipt from project records."
                danger
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectAttachmentsPanel({ projectId, canManage }: { projectId: string; canManage: boolean }) {
    const [items, setItems] = useState<ProjectAttachmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ storagePath: '', originalFilename: '', mimeType: '' });
    const { push } = useToast();

    const loadAttachments = async () => {
        setLoading(true);
        setItems(await listProjectAttachments(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadAttachments();
    }, [projectId]);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.storagePath.trim()) {
            push('error', 'Document path is required.');
            return;
        }

        setSaving(true);
        const created = await createProjectAttachment({
            projectId,
            storagePath: form.storagePath.trim(),
            originalFilename: form.originalFilename.trim() || 'Document',
            mimeType: form.mimeType.trim() || null,
            visibilityStatus: 'internal',
        });
        setSaving(false);

        if (!created) {
            push('error', 'Could not add document.');
            return;
        }

        push('success', 'Document added.');
        setModalOpen(false);
        setForm({ storagePath: '', originalFilename: '', mimeType: '' });
        await loadAttachments();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectAttachment(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete document.');
            return;
        }
        push('success', 'Document deleted.');
        await loadAttachments();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading documents...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Documents</p>
                        <p className="mt-1 text-sm text-[#667085]">Shared drawings, approvals, and supporting files.</p>
                    </div>
                    {canManage ? <AppButton variant="primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add document</AppButton> : null}
                </div>

                {items.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<FileText className="h-5 w-5" />} title="No documents attached" description="Attach the latest drawings, permits, and approvals for the project." /></div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#E6E8EC] p-3">
                                <div>
                                    <p className="font-medium text-[#17243A]">{item.originalFilename || 'Document'}</p>
                                    <p className="mt-1 text-xs text-[#667085]">{item.mimeType || 'file'} - {item.createdAt ? formatDate(item.createdAt) : 'Recent'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={item.storagePath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                                        <Link2 className="h-4 w-4" /> Open
                                    </a>
                                    {canManage ? <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></AppButton> : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Document" title="Add document" onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid gap-3">
                            <Field label="Document URL or storage path" required>
                                <input className={inputClass} value={form.storagePath} onChange={(event) => setForm((prev) => ({ ...prev, storagePath: event.target.value }))} />
                            </Field>
                            <Field label="File name">
                                <input className={inputClass} value={form.originalFilename} onChange={(event) => setForm((prev) => ({ ...prev, originalFilename: event.target.value }))} />
                            </Field>
                            <Field label="Mime type">
                                <input className={inputClass} value={form.mimeType} onChange={(event) => setForm((prev) => ({ ...prev, mimeType: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add document'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete document?"
                message="This will remove the selected document from the project."
                danger
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectClientAccessPanel({ projectId }: { projectId: string }) {
    const [accessRows, setAccessRows] = useState<ProjectClientAccessRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [email, setEmail] = useState('');
    const { push } = useToast();

    const loadAccess = async () => {
        setLoading(true);
        setAccessRows(await listProjectClientAccess(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadAccess();
    }, [projectId]);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!email.trim()) {
            push('error', 'Email is required.');
            return;
        }

        setSaving(true);
        const created = await createProjectClientAccess({ projectId, email: email.trim() });
        setSaving(false);

        if (!created) {
            push('error', 'Could not grant customer access.');
            return;
        }

        push('success', 'Customer access granted.');
        setEmail('');
        setModalOpen(false);
        await loadAccess();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await revokeProjectClientAccess(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not revoke customer access.');
            return;
        }
        push('success', 'Customer access revoked.');
        await loadAccess();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading client access...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Customer access</p>
                        <p className="mt-1 text-sm text-[#667085]">Who has access to project updates and shared financial visibility.</p>
                    </div>
                    <AppButton variant="primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Grant access</AppButton>
                </div>
                {accessRows.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<Users className="h-5 w-5" />} title="No customer access entries" description="Grant project visibility to relevant customer contacts when needed." /></div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {accessRows.map((row) => (
                            <div key={row.id} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-[#17243A]">{row.email}</p>
                                    <p className="text-xs text-[#667085]">Invited {row.invitedAt ? formatDate(row.invitedAt) : 'recently'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusPill label={row.invitationStatus} tone={row.invitationStatus === 'accepted' ? 'success' : row.invitationStatus === 'pending' ? 'info' : 'warning'} />
                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(row.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Customer access" title="Grant customer access" onClose={() => setModalOpen(false)} size="md">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Field label="Customer email" required>
                            <input type="email" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
                        </Field>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Grant access'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Revoke customer access?"
                message="This will revoke selected customer access to project updates."
                danger
                confirmLabel="Revoke"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectInvestorsPanel({ projectId }: { projectId: string }) {
    const [investors, setInvestors] = useState<ProjectInvestorRecord[]>([]);
    const [selectedInvestorId, setSelectedInvestorId] = useState('');
    const [contributions, setContributions] = useState<InvestorContributionRecord[]>([]);
    const [contributionModalOpen, setContributionModalOpen] = useState(false);
    const [editingContribution, setEditingContribution] = useState<InvestorContributionRecord | null>(null);
    const [deleteContributionId, setDeleteContributionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectInvestorRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [savingContribution, setSavingContribution] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        investmentPercentage: '',
        isActive: true,
    });
    const [contributionForm, setContributionForm] = useState({
        investorId: '',
        amount: '',
        contributionDate: '',
        referenceNumber: '',
        notes: '',
    });
    const { push } = useToast();

    const loadInvestors = async () => {
        setLoading(true);
        const rows = await listProjectInvestors(projectId);
        setInvestors(rows);
        setSelectedInvestorId((prev) => {
            if (prev && rows.some((item) => item.id === prev)) return prev;
            return rows[0]?.id ?? '';
        });
        setLoading(false);
    };

    const loadContributions = async (investorId: string) => {
        if (!investorId) {
            setContributions([]);
            return;
        }
        setContributions(await listInvestorContributions(investorId));
    };

    useEffect(() => {
        void loadInvestors();
    }, [projectId]);

    useEffect(() => {
        void loadContributions(selectedInvestorId);
    }, [selectedInvestorId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', email: '', phone: '', investmentPercentage: '', isActive: true });
        setModalOpen(true);
    };

    const openEdit = (investor: ProjectInvestorRecord) => {
        setEditing(investor);
        setForm({
            name: investor.name,
            email: investor.email || '',
            phone: investor.phone || '',
            investmentPercentage: investor.investmentPercentage !== null && investor.investmentPercentage !== undefined ? String(investor.investmentPercentage) : '',
            isActive: investor.isActive,
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim()) {
            push('error', 'Investor name is required.');
            return;
        }
        const investmentPercentage = parseOptionalNumber(form.investmentPercentage);
        if (investmentPercentage !== null && (investmentPercentage < 0 || investmentPercentage > 100)) {
            push('error', 'Share must be between 0 and 100.');
            return;
        }

        setSaving(true);
        const payload = {
            name: form.name.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            investmentPercentage,
            isActive: form.isActive,
        };

        const result = editing
            ? await updateProjectInvestor(editing.id, payload)
            : await createProjectInvestor({
                projectId,
                userId: null,
                ...payload,
                canViewFinancials: true,
                canApprovePayments: false,
                canViewClientReceipts: true,
            });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update investor.' : 'Could not add investor.');
            return;
        }

        push('success', editing ? 'Investor updated.' : 'Investor added.');
        setModalOpen(false);
        await loadInvestors();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectInvestor(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete investor.');
            return;
        }
        push('success', 'Investor deleted.');
        await loadInvestors();
    };

    const openContributionCreate = () => {
        if (!selectedInvestorId) {
            push('error', 'Select an investor first.');
            return;
        }
        setEditingContribution(null);
        setContributionForm({ investorId: selectedInvestorId, amount: '', contributionDate: '', referenceNumber: '', notes: '' });
        setContributionModalOpen(true);
    };

    const openContributionEdit = (row: InvestorContributionRecord) => {
        setEditingContribution(row);
        setContributionForm({
            investorId: row.investorId,
            amount: String(row.amount ?? ''),
            contributionDate: asInputDate(row.contributionDate),
            referenceNumber: row.referenceNumber || '',
            notes: row.notes || '',
        });
        setContributionModalOpen(true);
    };

    const handleContributionSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!contributionForm.investorId) {
            push('error', 'Investor is required for contribution.');
            return;
        }

        const amount = parseNumber(contributionForm.amount);
        if (amount === null || amount <= 0) {
            push('error', 'Contribution amount must be greater than 0.');
            return;
        }

        setSavingContribution(true);
        const payload = {
            amount,
            contributionDate: contributionForm.contributionDate || null,
            referenceNumber: contributionForm.referenceNumber.trim() || null,
            notes: contributionForm.notes.trim() || null,
        };

        const result = editingContribution
            ? await updateInvestorContribution(editingContribution.id, payload)
            : await createInvestorContribution({ investorId: contributionForm.investorId, ...payload });

        setSavingContribution(false);

        if (!result) {
            push('error', editingContribution ? 'Could not update contribution.' : 'Could not add contribution.');
            return;
        }

        push('success', editingContribution ? 'Contribution updated.' : 'Contribution added.');
        setSelectedInvestorId(contributionForm.investorId);
        setContributionModalOpen(false);
        await loadContributions(contributionForm.investorId);
    };

    const handleContributionDelete = async () => {
        if (!deleteContributionId) return;
        const ok = await deleteInvestorContribution(deleteContributionId);
        setDeleteContributionId(null);
        if (!ok) {
            push('error', 'Could not delete contribution.');
            return;
        }
        push('success', 'Contribution deleted.');
        await loadContributions(selectedInvestorId);
    };

    const selectedInvestor = investors.find((item) => item.id === selectedInvestorId) || null;
    const contributionTotal = contributions.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading investors...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Investors</p>
                        <p className="mt-1 text-sm text-[#667085]">Track investor participation, agreed share, and contribution totals.</p>
                    </div>
                    <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add investor</AppButton>
                </div>
                {investors.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<Users className="h-5 w-5" />} title="No investors added" description="Add investors to track shareholding, funding, and contribution history." /></div>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3">Investor</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Share</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {investors.map((investor) => (
                                    <tr key={investor.id}>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{investor.name}</td>
                                        <td className="px-4 py-3 text-[#344054]">{investor.email || investor.phone || 'No contact'}</td>
                                        <td className="px-4 py-3 text-[#344054]">{investor.investmentPercentage ?? '-'}%</td>
                                        <td className="px-4 py-3"><StatusPill label={investor.isActive ? 'Active' : 'Inactive'} tone={investor.isActive ? 'success' : 'neutral'} /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(investor)}><Pencil className="h-4 w-4" /></AppButton>
                                                <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(investor.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Investor contributions</p>
                        <p className="mt-1 text-sm text-[#667085]">Track contribution history and capital inflow by investor.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <AppButton variant="primary" onClick={openContributionCreate}><Plus className="h-4 w-4" /> Add contribution</AppButton>
                    </div>
                </div>

                {!selectedInvestor ? (
                    <div className="mt-4"><EmptyState icon={<Users className="h-5 w-5" />} title="No investor selected" description="Choose an investor to view and manage contribution records." /></div>
                ) : contributions.length === 0 ? (
                    <div className="mt-4">
                        <EmptyState icon={<FileText className="h-5 w-5" />} title="No contributions added" description="Record contributions from this investor to build the funding ledger." />
                    </div>
                ) : (
                    <>
                        <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-slate-50 px-4 py-3 text-sm text-[#344054]">
                            <span className="font-medium text-[#17243A]">{selectedInvestor.name}</span> total contribution: <span className="font-semibold text-[#17243A]">{formatINR(contributionTotal)}</span>
                        </div>
                        <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                            <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                                <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Notes</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                    {contributions.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-4 py-3 text-[#344054]">{row.contributionDate ? formatDate(row.contributionDate) : '-'}</td>
                                            <td className="px-4 py-3 font-medium text-[#17243A]">{formatINR(Number(row.amount ?? 0))}</td>
                                            <td className="px-4 py-3 text-[#344054]">{row.referenceNumber || '-'}</td>
                                            <td className="px-4 py-3 text-[#344054]">{row.notes || '-'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openContributionEdit(row)}><Pencil className="h-4 w-4" /></AppButton>
                                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteContributionId(row.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Investor" title={editing ? 'Edit investor' : 'Add investor'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Name" required>
                                <input className={inputClass} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                            </Field>
                            <Field label="Share %">
                                <input type="number" min="0" max="100" step="0.01" className={inputClass} value={form.investmentPercentage} onChange={(event) => setForm((prev) => ({ ...prev, investmentPercentage: event.target.value }))} />
                            </Field>
                            <Field label="Email">
                                <input type="email" className={inputClass} value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                            </Field>
                            <Field label="Phone">
                                <input type="tel" inputMode="numeric" maxLength={10} className={inputClass} value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                            </Field>
                        </div>

                        {editing ? (
                            <label className="inline-flex items-center gap-2 text-sm text-[#344054]">
                                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
                                Active investor
                            </label>
                        ) : null}

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add investor'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete investor?"
                message="This will remove the selected investor from this project."
                danger
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            {contributionModalOpen && (
                <Modal eyebrow="Contribution" title={editingContribution ? 'Edit contribution' : 'Add contribution'} onClose={() => setContributionModalOpen(false)} size="lg">
                    <form onSubmit={handleContributionSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Investor" required>
                                <select className={inputClass} value={contributionForm.investorId} onChange={(event) => setContributionForm((prev) => ({ ...prev, investorId: event.target.value }))}>
                                    <option value="">Select investor</option>
                                    {investors.map((investor) => (
                                        <option key={investor.id} value={investor.id}>{investor.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Amount" required>
                                <input type="number" min="0" step="0.01" className={inputClass} value={contributionForm.amount} onChange={(event) => setContributionForm((prev) => ({ ...prev, amount: event.target.value }))} />
                            </Field>
                            <Field label="Contribution date">
                                <input type="date" className={inputClass} value={contributionForm.contributionDate} onChange={(event) => setContributionForm((prev) => ({ ...prev, contributionDate: event.target.value }))} />
                            </Field>
                            <Field label="Reference number">
                                <input className={inputClass} value={contributionForm.referenceNumber} onChange={(event) => setContributionForm((prev) => ({ ...prev, referenceNumber: event.target.value }))} />
                            </Field>
                            <Field label="Notes">
                                <textarea className={`${inputClass} min-h-[96px]`} value={contributionForm.notes} onChange={(event) => setContributionForm((prev) => ({ ...prev, notes: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setContributionModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={savingContribution}>{savingContribution ? 'Saving...' : editingContribution ? 'Save changes' : 'Add contribution'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteContributionId}
                title="Delete contribution?"
                message="This removes the selected contribution entry from investor funding history."
                danger
                confirmLabel="Delete"
                onConfirm={handleContributionDelete}
                onCancel={() => setDeleteContributionId(null)}
            />
        </>
    );
}
