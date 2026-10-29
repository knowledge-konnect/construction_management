import { AppButton, PageHeader, PremiumCard, StatCard, StatusPill } from '@/components/ui/DesignSystem';
import { formatDate, formatINR } from '@/lib/utils';
import { listProjects, type ProjectRecord } from '@/services/project.service';
import {
    getCollectionsReport,
    getCompanySummary,
    getExpensesReport,
    getProjectsReport,
    getSupplierOutstandingReport,
    type CollectionReportRow,
    type ExpenseReportRow,
    type ProjectReportRow,
} from '@/services/report.service';
import { Download, Filter, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function toCsv(rows: Array<Array<string | number>>) {
    return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function ReportsPage() {
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [projectRows, setProjectRows] = useState<ProjectReportRow[]>([]);
    const [expenses, setExpenses] = useState<ExpenseReportRow[]>([]);
    const [receipts, setReceipts] = useState<CollectionReportRow[]>([]);
    const [outstanding, setOutstanding] = useState<any[]>([]);
    const [summary, setSummary] = useState<{ projectsTracked: number; quotationRevenue: number; expenseTotal: number; profitEstimate: number } | null>(null);

    const [projectId, setProjectId] = useState('');
    const [status, setStatus] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);

        const filters = {
            projectId: projectId || undefined,
            status: status || undefined,
            from: from || undefined,
            to: to || undefined,
        };

        const [projectList, projectReport, expenseReport, collectionReport, outstandingReport, companySummary] = await Promise.all([
            listProjects(),
            getProjectsReport(filters),
            getExpensesReport(filters),
            getCollectionsReport(filters),
            getSupplierOutstandingReport(projectId || undefined),
            getCompanySummary({ from: filters.from, to: filters.to }),
        ]);

        setProjects(projectList);
        setProjectRows(projectReport);
        setExpenses(expenseReport.expenses);
        setReceipts(collectionReport.receipts);
        setOutstanding(outstandingReport.outstanding);
        setSummary(companySummary);

        if (!companySummary) setError('Some report data could not be loaded right now.');
        setLoading(false);
    };

    useEffect(() => { void load(); }, []);

    const totals = useMemo(() => {
        const expenseTotal = expenses.filter((row) => row.status !== 'void').reduce((sum, row) => sum + Number(row.bill_amount ?? 0), 0);
        const receiptTotal = receipts.filter((row) => !row.voided_at).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
        const outstandingTotal = outstanding.reduce((sum, row) => sum + Number(row.outstandingAmount ?? 0), 0);
        return { expenseTotal, receiptTotal, outstandingTotal };
    }, [expenses, receipts, outstanding]);

    const financialHealth = useMemo(() => {
        const contractTotal = projectRows.reduce((sum, row) => sum + Number(row.contract_amount ?? 0), 0);
        const remainingBudget = contractTotal - totals.expenseTotal;
        const budgetOverrun = Math.max(0, totals.expenseTotal - contractTotal);
        const collectionGap = Math.max(0, contractTotal - totals.receiptTotal);
        return {
            contractTotal,
            remainingBudget,
            budgetOverrun,
            collectionGap,
            utilizationPct: contractTotal > 0 ? Math.min(100, Math.round((totals.expenseTotal / contractTotal) * 100)) : 0,
        };
    }, [projectRows, totals.expenseTotal, totals.receiptTotal]);

    const followUps = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const inFiveDays = new Date(today);
        inFiveDays.setDate(inFiveDays.getDate() + 5);

        const supplier = expenses
            .filter((row) => Number(row.outstandingAmount ?? 0) > 0)
            .map((row) => {
                const dueDate = row.due_date ? new Date(row.due_date) : null;
                const outstandingAmount = Number(row.outstandingAmount ?? 0);
                const overdue = dueDate ? dueDate < today : false;
                const dueSoon = dueDate ? dueDate >= today && dueDate <= inFiveDays : false;
                return {
                    id: row.id,
                    type: 'supplier' as const,
                    label: row.supplier_name || row.supplier_bill_number || 'Supplier payment',
                    amount: outstandingAmount,
                    dueDate: row.due_date || null,
                    urgency: overdue ? 'Overdue' : dueSoon ? 'Due soon' : 'Upcoming',
                };
            })
            .sort((a, b) => Number(new Date(a.dueDate || '9999-12-31')) - Number(new Date(b.dueDate || '9999-12-31')));

        const client = projectRows
            .map((row) => {
                const received = receipts
                    .filter((receipt) => receipt.project_id === row.id && !receipt.voided_at)
                    .reduce((sum, receipt) => sum + Number(receipt.amount ?? 0), 0);
                const pending = Math.max(0, Number(row.contract_amount ?? 0) - received);
                if (pending <= 0) return null;
                const dueDate = row.expected_end_date ?? null;
                const due = dueDate ? new Date(dueDate) : null;
                const overdue = due ? due < today : false;
                const dueSoon = due ? due >= today && due <= inFiveDays : false;
                return {
                    id: row.id,
                    type: 'client' as const,
                    label: row.name,
                    amount: pending,
                    dueDate,
                    urgency: overdue ? 'Overdue' : dueSoon ? 'Due soon' : 'Upcoming',
                };
            })
            .filter((row): row is NonNullable<typeof row> => !!row)
            .sort((a, b) => Number(new Date(a.dueDate || '9999-12-31')) - Number(new Date(b.dueDate || '9999-12-31')));

        return {
            supplier: supplier.slice(0, 6),
            client: client.slice(0, 6),
        };
    }, [expenses, projectRows, receipts]);

    const handleExport = () => {
        const csvRows: Array<Array<string | number>> = [
            ['Section', 'Reference', 'Date', 'Value', 'Status'],
            ...projectRows.map((row) => ['Project', row.project_number ?? row.name ?? '-', row.start_date ?? row.created_at ?? '-', Number(row.contract_amount ?? 0), row.status ?? '-']),
            ...expenses.map((row) => ['Expense', row.supplier_bill_number ?? row.description ?? '-', row.bill_date ?? row.created_at ?? '-', Number(row.bill_amount ?? 0), row.status ?? '-']),
            ...receipts.map((row) => ['Collection', row.receipt_number ?? '-', row.received_date ?? row.created_at ?? '-', Number(row.amount ?? 0), row.voided_at ? 'void' : 'received']),
        ];

        const blob = new Blob([toCsv(csvRows)], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reports-export.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reports"
                actions={
                    <div className="flex items-center gap-2">
                        <AppButton variant="secondary" onClick={() => void load()}>
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </AppButton>
                        <AppButton onClick={handleExport}>
                            <Download className="h-4 w-4" />
                            Export CSV
                        </AppButton>
                    </div>
                }
            />

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <PremiumCard className="p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#17243A]"><Filter className="h-4 w-4" /> Filters</div>
                <div className="grid gap-3 md:grid-cols-4">
                    <label className="block">
                        <span className="mb-1 block text-xs text-[#667085]">Project</span>
                        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]">
                            <option value="">All projects</option>
                            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs text-[#667085]">Status</span>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]">
                            <option value="">All</option>
                            <option value="planned">Planned</option>
                            <option value="in_progress">In progress</option>
                            <option value="on_hold">On hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs text-[#667085]">From</span>
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]" />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs text-[#667085]">To</span>
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A]" />
                    </label>
                </div>
                <div className="mt-4">
                    <AppButton onClick={() => void load()} disabled={loading}>{loading ? 'Applying…' : 'Apply filters'}</AppButton>
                </div>
            </PremiumCard>

            <div className="grid gap-4 md:grid-cols-4">
                <Metric label="Revenue" value={formatINR(summary?.quotationRevenue ?? 0)} />
                <Metric label="Expenses" value={formatINR(summary?.expenseTotal ?? totals.expenseTotal)} />
                <Metric label="Collections" value={formatINR(totals.receiptTotal)} />
                <Metric label="Supplier outstanding" value={formatINR(totals.outstandingTotal)} />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Metric label="Budgeted value" value={formatINR(financialHealth.contractTotal)} />
                <Metric label="Budget remaining" value={formatINR(financialHealth.remainingBudget)} />
                <Metric label="Budget overrun" value={formatINR(financialHealth.budgetOverrun)} />
                <Metric label="Collections pending" value={formatINR(financialHealth.collectionGap)} />
            </div>

            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Budget vs actual</p>
                        <p className="mt-1 text-sm text-[#667085]">Expense utilization against project contract values.</p>
                    </div>
                    <StatusPill
                        label={financialHealth.budgetOverrun > 0 ? 'Over budget' : 'Within budget'}
                        tone={financialHealth.budgetOverrun > 0 ? 'warning' : 'success'}
                    />
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${financialHealth.utilizationPct > 100 ? 'bg-red-500' : 'bg-[#1D4ED8]'}`} style={{ width: `${Math.max(4, Math.min(financialHealth.utilizationPct, 100))}%` }} />
                </div>
                <p className="mt-2 text-xs text-[#667085]">{financialHealth.utilizationPct}% of budget consumed by current expenses.</p>
            </PremiumCard>

            <div className="grid gap-6 xl:grid-cols-2">
                <PremiumCard className="overflow-hidden">
                    <div className="border-b border-[#E6E8EC] px-5 py-4">
                        <h2 className="text-base font-semibold text-[#17243A]">Client follow-ups</h2>
                    </div>
                    {followUps.client.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-slate-500">No pending collection follow-ups.</div>
                    ) : (
                        <div className="divide-y divide-[#E6E8EC]">
                            {followUps.client.map((item) => (
                                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#17243A]">{item.label}</p>
                                        <p className="text-xs text-[#667085]">Due {item.dueDate ? formatDate(item.dueDate) : 'date not set'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-[#17243A]">{formatINR(item.amount)}</p>
                                        <StatusPill label={item.urgency} tone={item.urgency === 'Overdue' ? 'warning' : item.urgency === 'Due soon' ? 'info' : 'neutral'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PremiumCard>

                <PremiumCard className="overflow-hidden">
                    <div className="border-b border-[#E6E8EC] px-5 py-4">
                        <h2 className="text-base font-semibold text-[#17243A]">Supplier follow-ups</h2>
                    </div>
                    {followUps.supplier.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-slate-500">No pending supplier follow-ups.</div>
                    ) : (
                        <div className="divide-y divide-[#E6E8EC]">
                            {followUps.supplier.map((item) => (
                                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#17243A]">{item.label}</p>
                                        <p className="text-xs text-[#667085]">Due {item.dueDate ? formatDate(item.dueDate) : 'date not set'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-[#17243A]">{formatINR(item.amount)}</p>
                                        <StatusPill label={item.urgency} tone={item.urgency === 'Overdue' ? 'warning' : item.urgency === 'Due soon' ? 'info' : 'neutral'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PremiumCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <PremiumCard className="overflow-hidden">
                    <div className="border-b border-[#E6E8EC] px-5 py-4">
                        <h2 className="text-base font-semibold text-[#17243A]">Projects ({projectRows.length})</h2>
                    </div>
                    {loading ? (
                        <div className="px-5 py-8 text-sm text-slate-500">Loading projects…</div>
                    ) : projectRows.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-slate-500">No projects for selected filters.</div>
                    ) : (
                        <div className="divide-y divide-[#E6E8EC]">
                            {projectRows.slice(0, 8).map((row) => (
                                <div key={row.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#17243A]">{row.name}</p>
                                        <p className="text-xs text-[#667085]">{row.project_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-[#17243A]">{formatINR(Number(row.contract_amount ?? 0))}</p>
                                        <StatusPill label={String(row.status ?? 'planned').replace('_', ' ')} tone={row.status === 'completed' ? 'success' : row.status === 'on_hold' ? 'warning' : 'info'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PremiumCard>

                <PremiumCard className="overflow-hidden">
                    <div className="border-b border-[#E6E8EC] px-5 py-4">
                        <h2 className="text-base font-semibold text-[#17243A]">Collections ({receipts.length})</h2>
                    </div>
                    {loading ? (
                        <div className="px-5 py-8 text-sm text-slate-500">Loading collections…</div>
                    ) : receipts.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-slate-500">No collections for selected filters.</div>
                    ) : (
                        <div className="divide-y divide-[#E6E8EC]">
                            {receipts.slice(0, 8).map((row) => (
                                <div key={row.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#17243A]">{row.receipt_number ?? 'Receipt'}</p>
                                        <p className="text-xs text-[#667085]">{row.received_date ? formatDate(row.received_date) : 'Date not set'}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-[#17243A]">{formatINR(Number(row.amount ?? 0))}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </PremiumCard>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <StatCard
            label={label}
            value={value}
            sub="Updated from current report filters"
        />
    );
}
