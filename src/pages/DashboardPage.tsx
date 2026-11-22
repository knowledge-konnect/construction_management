import { InlineLoader } from '@/components/loading/Loaders';
import DataTable, { CellStack, type Column } from '@/components/ui/DataTable';
import { AppButton, EmptyState, PageHeader, PremiumCard, SkeletonRow, StatCardButton, StatusPill } from '@/components/ui/DesignSystem';
import { BUSINESS_MODEL_FORM_CONFIG } from '@/lib/businessModels';
import { formatDate, formatINR, formatTime } from '@/lib/utils';
import { listProjects, type ProjectRecord } from '@/services/project.service';
import { listInvestorContributions, listProjectInvestors } from '@/services/projectCost.service';
import {
    getCollectionsReport,
    getCompanyReceipts,
    getDashboardReport,
    getDashboardV2,
    getExpensesReport,
    getMonthlyFinancialReport,
    type CollectionReportRow,
    type CompanyReceiptRow,
    type DashboardProjectSummary,
    type DashboardReport,
    type ExpenseReportRow,
    type MonthlyFinancialEntry,
    type PendingSupplierPayment,
    type ProjectProgressSummary,
} from '@/services/report.service';
import {
    AlertTriangle,
    BarChart3,
    Building2,
    CalendarClock,
    ChevronRight,
    ClipboardList,
    FolderKanban,
    HardHat,
    IndianRupee,
    Plus,
    ReceiptText,
    RefreshCcw,
    TrendingDown,
    TrendingUp,
    Wallet,
    WalletCards
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const formatStatus = (status: string) => {
    const label = status.replace(/_/g, ' ');
    return label.charAt(0).toUpperCase() + label.slice(1);
};

const kpiIcons: Record<string, ReactNode> = {
    'Active Projects': <FolderKanban className="h-5 w-5 text-[var(--primary)]" />,
    'Total Project Value': <IndianRupee className="h-5 w-5 text-[var(--primary)]" />,
    'Total Invoiced': <IndianRupee className="h-5 w-5 text-[var(--primary)]" />,
    'Amount Collected': <Wallet className="h-5 w-5 text-[var(--primary)]" />,
    'Amount Due': <CalendarClock className="h-5 w-5 text-[var(--primary)]" />,
    'Total Expenses': <WalletCards className="h-5 w-5 text-[var(--primary)]" />,
    'Net Cash Flow': <BarChart3 className="h-5 w-5 text-[var(--primary)]" />,
};

const kpiIconTones: Record<string, string> = {
    'Active Projects': 'bg-[var(--primary-soft)] text-[var(--primary)]',
    'Total Invoiced': 'bg-[color-mix(in_oklab,var(--chart-1)_16%,white)] text-[var(--primary)]',
    'Amount Collected': 'bg-[color-mix(in_oklab,var(--success)_14%,white)] text-[var(--success)]',
    'Amount Due': 'bg-[color-mix(in_oklab,var(--warning)_16%,white)] text-[var(--warning-fg)]',
    'Total Expenses': 'bg-[color-mix(in_oklab,var(--chart-3)_15%,white)] text-[var(--danger-fg)]',
    'Net Cash Flow': 'bg-[color-mix(in_oklab,var(--primary)_12%,white)] text-[var(--primary)]',
};

type DashboardTransaction = {
    id: string;
    kind: 'collection' | 'expense' | 'investment';
    amount: number;
    occurredOn: string | null;
    reference: string;
    statusLabel: string;
    statusTone: 'neutral' | 'info' | 'warning' | 'success';
    projectId: string | null;
    projectName: string;
    counterparty: string;
    isCompanyLevel: boolean;
};

type ProjectDashboardFilter = 'all' | 'active' | 'planned' | 'completed';

type SnapshotMetricTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type SnapshotMetric = {
    label: string;
    value: string;
    tone: SnapshotMetricTone;
    icon: ReactNode;
};

function dateValue(value?: string | null): number {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
}

function inDateWindow(value: string | null | undefined, from?: string, to?: string): boolean {
    if (!from && !to) return true;
    if (!value) return false;
    const time = dateValue(value);
    if (!time) return false;
    if (from) {
        const fromTime = dateValue(from);
        if (fromTime && time < fromTime) return false;
    }
    if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
            toDate.setHours(23, 59, 59, 999);
            if (time > toDate.getTime()) return false;
        }
    }
    return true;
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<DashboardReport | null>(null);
    const [projectProgress, setProjectProgress] = useState<ProjectProgressSummary[]>([]);
    const [pendingSupplierPayments, setPendingSupplierPayments] = useState<PendingSupplierPayment[]>([]);
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [monthlySeries, setMonthlySeries] = useState<MonthlyFinancialEntry[]>([]);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [syncedAt, setSyncedAt] = useState<string | null>(null);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [appliedFrom, setAppliedFrom] = useState('');
    const [appliedTo, setAppliedTo] = useState('');
    const [expenseRows, setExpenseRows] = useState<ExpenseReportRow[]>([]);
    const [collectionRows, setCollectionRows] = useState<CollectionReportRow[]>([]);
    const [companyOnlyReceipts, setCompanyOnlyReceipts] = useState<CompanyReceiptRow[]>([]);
    const [investorContributionRows, setInvestorContributionRows] = useState<Array<{
        id: string;
        projectId: string;
        projectName: string;
        investorName: string;
        amount: number;
        contributionDate: string | null;
        referenceNumber: string | null;
    }>>([]);
    const [projectFilter, setProjectFilter] = useState<ProjectDashboardFilter>('all');

    // Global project selector for filtering KPIs and financial sections
    const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');

    const projectById = useMemo(
        () => new Map(projects.map((project) => [project.id, project])),
        [projects],
    );

    const formatCurrencyValue = (value: number | null | undefined) => {
        if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
        if (!Number.isFinite(value)) return 'N/A';
        return formatINR(value);
    };

    const getProjectValueMeta = (project: ProjectRecord | DashboardProjectSummary) => {
        const isProjectRecord = 'contractAmount' in project;
        if (isProjectRecord) {
            const rec = project as ProjectRecord;
            const modelConfig = BUSINESS_MODEL_FORM_CONFIG[rec.businessModel ?? 'contract_construction'];
            const contractValue = Number(rec.contractAmount ?? 0);
            const projectedSales = Number(rec.projectedSalesValue ?? 0);
            const valueForDisplay = rec.businessModel === 'property_development' && projectedSales > 0 && contractValue === 0
                ? projectedSales
                : contractValue;
            return { label: rec.businessModel ? modelConfig.contractValueLabel : 'Project value', value: valueForDisplay };
        }
        const sum = project as DashboardProjectSummary;
        const modelKey = (sum.businessModel ?? 'contract_construction') as keyof typeof BUSINESS_MODEL_FORM_CONFIG;
        const modelConfig = BUSINESS_MODEL_FORM_CONFIG[modelKey in BUSINESS_MODEL_FORM_CONFIG ? modelKey : 'contract_construction'];
        const contractValue = Number(sum.contractValue ?? 0);
        const projectedSales = Number(sum.projectedSalesValue ?? 0);
        const valueForDisplay = sum.businessModel === 'property_development' && projectedSales > 0 && contractValue === 0
            ? projectedSales
            : contractValue;
        return { label: sum.businessModel ? modelConfig.contractValueLabel : 'Project value', value: valueForDisplay };
    };

    const loadDashboard = async (projectId: string | 'all' = selectedProjectId) => {
        setLoadingDashboard(true);
        setError(null);
        const scopedProjectId = projectId === 'all' ? undefined : projectId;
        try {
            const [dashboardReport, dashboardV2, projectRows, monthlyData] = await Promise.all([
                getDashboardReport(scopedProjectId),
                getDashboardV2(),
                listProjects(),
                getMonthlyFinancialReport(scopedProjectId),
            ]);

            if (!dashboardReport) {
                setError('Unable to load dashboard totals right now.');
            }

            setDashboard(dashboardReport);
            setProjectProgress(dashboardV2?.projectProgress ?? []);
            setPendingSupplierPayments(dashboardV2?.pendingSupplierPayments ?? []);
            setProjects(projectRows);
            setMonthlySeries(monthlyData?.monthly ?? []);
            setSyncedAt(new Date().toISOString());
        } catch (err) {
            console.error(err);
            setError('Unable to load dashboard totals right now.');
            setDashboard(null);
            setProjectProgress([]);
            setPendingSupplierPayments([]);
            setProjects([]);
            setMonthlySeries([]);
        } finally {
            setLoadingDashboard(false);
        }
    };

    const loadTransactions = async (filters?: { from?: string; to?: string }) => {
        setLoadingTransactions(true);
        setTransactionError(null);

        const fromValue = filters?.from ?? from;
        const toValue = filters?.to ?? to;

        if (fromValue && toValue && dateValue(fromValue) > dateValue(toValue)) {
            setTransactionError('Start date cannot be later than end date.');
            setLoadingTransactions(false);
            return;
        }

        const projectIdFilter = selectedProjectId === 'all' ? undefined : selectedProjectId;

        try {
            const [expenseReport, collectionReport, companyReceipts] = await Promise.all([
                getExpensesReport({ from: fromValue || undefined, to: toValue || undefined, projectId: projectIdFilter }),
                getCollectionsReport({ from: fromValue || undefined, to: toValue || undefined, projectId: projectIdFilter }),
                getCompanyReceipts({ projectId: null }),
            ]);

            setExpenseRows(expenseReport.expenses);
            setCollectionRows(collectionReport.receipts);
            setCompanyOnlyReceipts(
                companyReceipts.filter(
                    (row) => row.projectId == null && inDateWindow(row.receivedDate ?? row.createdAt, fromValue, toValue),
                ),
            );
        } catch (err) {
            console.error(err);
            setTransactionError('Unable to load recent transactions right now.');
            setExpenseRows([]);
            setCollectionRows([]);
            setCompanyOnlyReceipts([]);
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        void Promise.all([loadDashboard(selectedProjectId), loadTransactions({ from, to })]);
    }, [selectedProjectId]);

    const projectSummaryMap = useMemo(() => {
        const map = new Map<string, DashboardProjectSummary>();
        for (const row of dashboard?.projectSummaries ?? []) {
            map.set(row.projectId, row);
        }
        return map;
    }, [dashboard]);

    const monthlyChartData = useMemo(() => {
        const monthKeys = Array.from({ length: 6 }, (_, index) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(1);
            date.setMonth(date.getMonth() - (5 - index));
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });

        const lookup = new Map((monthlySeries ?? []).map((entry) => [entry.month, entry]));
        return monthKeys.map((month) => {
            const entry = lookup.get(month) ?? { month, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
            return {
                month,
                billed: Number(entry.billed ?? 0),
                collected: Number(entry.collected ?? 0),
                expenses: Number(entry.expenses ?? 0),
                netCashFlow: Number(entry.netCashFlow ?? 0),
            };
        });
    }, [monthlySeries]);

    const recentTransactions = useMemo<DashboardTransaction[]>(() => {
        const collectionTransactions = collectionRows.map((row) => {
            const project = row.project_id ? projectById.get(row.project_id) : null;
            return {
                id: `collection-${row.id}`,
                kind: 'collection' as const,
                amount: Number(row.amount ?? 0),
                occurredOn: row.received_date ?? row.created_at ?? null,
                reference: row.receipt_number ?? 'Client receipt',
                statusLabel: row.voided_at ? 'Voided' : 'Received',
                statusTone: row.voided_at ? 'warning' as const : 'success' as const,
                projectId: row.project_id ?? null,
                projectName: project?.name ?? 'Project receipt',
                counterparty: 'Client collection',
                isCompanyLevel: false,
            };
        });

        const companyCollectionTransactions = selectedProjectId === 'all' ? companyOnlyReceipts.map((row) => ({
            id: `company-collection-${row.id}`,
            kind: 'collection' as const,
            amount: Number(row.amount ?? 0),
            occurredOn: row.receivedDate ?? row.createdAt ?? null,
            reference: row.receiptNumber || 'Company receipt',
            statusLabel: row.voidedAt ? 'Voided' : 'Received',
            statusTone: row.voidedAt ? 'warning' as const : 'success' as const,
            projectId: null,
            projectName: 'Company-level',
            counterparty: row.customer?.name || 'Client collection',
            isCompanyLevel: true,
        })) : [];

        const expenseTransactions = expenseRows.map((row) => {
            const project = row.project_id ? projectById.get(row.project_id) : null;
            const label = String(row.status ?? 'unpaid');
            return {
                id: `expense-${row.id}`,
                kind: 'expense' as const,
                amount: Number(row.bill_amount ?? 0),
                occurredOn: row.bill_date ?? row.created_at ?? null,
                reference: row.supplier_bill_number ?? row.description ?? 'Supplier expense',
                statusLabel: formatStatus(label),
                statusTone: label === 'paid' ? 'success' as const : label === 'void' ? 'warning' as const : 'info' as const,
                projectId: row.project_id ?? null,
                projectName: project?.name ?? 'Project expense',
                counterparty: row.supplier_name || 'Supplier payment',
                isCompanyLevel: false,
            };
        });

        const investmentTransactions = investorContributionRows
            .filter((row) => (selectedProjectId === 'all' || row.projectId === selectedProjectId) && inDateWindow(row.contributionDate, from, to))
            .map((row) => ({
                id: `investment-${row.id}`,
                kind: 'investment' as const,
                amount: Number(row.amount ?? 0),
                occurredOn: row.contributionDate ?? null,
                reference: row.referenceNumber ?? 'Investor contribution',
                statusLabel: 'Received',
                statusTone: 'success' as const,
                projectId: row.projectId ?? null,
                projectName: row.projectName ?? 'Investor funding',
                counterparty: row.investorName || 'Investor',
                isCompanyLevel: false,
            }));

        return [...collectionTransactions, ...companyCollectionTransactions, ...expenseTransactions, ...investmentTransactions]
            .sort((a, b) => dateValue(b.occurredOn) - dateValue(a.occurredOn))
            .slice(0, 10);
    }, [collectionRows, companyOnlyReceipts, expenseRows, investorContributionRows, projectById, selectedProjectId, from, to]);

    const isDateRangeValid = !from || !to || dateValue(from) <= dateValue(to);
    const hasDateRangeChanged = from !== appliedFrom || to !== appliedTo;

    const handleApplyFilters = () => {
        if (!isDateRangeValid || !hasDateRangeChanged) return;
        setAppliedFrom(from);
        setAppliedTo(to);
        void loadTransactions({ from, to });
    };

    const handleResetFilters = () => {
        setFrom('');
        setTo('');
        setAppliedFrom('');
        setAppliedTo('');
        void loadTransactions({ from: '', to: '' });
    };

    const openCreateProject = () => navigate('/projects', { state: { openCreate: true } });

    useEffect(() => {
        if (!projects.length) {
            setInvestorContributionRows([]);
            return;
        }

        let cancelled = false;
        const loadInvestorContributions = async () => {
            try {
                const rows = await Promise.all(projects.map(async (project) => {
                    const investors = await listProjectInvestors(project.id);
                    const contributions = await Promise.all(investors.map(async (investor) => {
                        const entries = await listInvestorContributions(investor.id);
                        return entries.map((entry) => ({
                            id: entry.id,
                            projectId: project.id,
                            projectName: project.name,
                            investorName: investor.name || 'Investor',
                            amount: Number(entry.amount ?? 0),
                            contributionDate: entry.contributionDate ?? entry.createdAt ?? null,
                            referenceNumber: entry.referenceNumber ?? 'Investor contribution',
                        }));
                    }));
                    return contributions.flat();
                }));

                if (!cancelled) {
                    setInvestorContributionRows(rows.flat());
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) setInvestorContributionRows([]);
            }
        };

        void loadInvestorContributions();
        return () => { cancelled = true; };
    }, [projects]);

    // Filtered project summaries based on global project selector
    const filteredSummaries = useMemo(() => {
        if (selectedProjectId === 'all') return dashboard?.projectSummaries ?? [];
        return (dashboard?.projectSummaries ?? []).filter((s) => s.projectId === selectedProjectId);
    }, [dashboard, selectedProjectId]);

    const isAllProjectsView = selectedProjectId === 'all';
    const selectedProjectSummary = isAllProjectsView ? null : (filteredSummaries[0] ?? null);

    // Aggregated KPI values based on filtered summaries (or global dashboard totals for "all")
    const kpiValues = useMemo(() => {
        if (!dashboard) return null;
        if (selectedProjectId === 'all') {
            return {
                activeProjects: projects.filter((p) => p.status === 'in_progress').length,
                totalBilled: dashboard.totalBilled,
                totalCollected: dashboard.totalCollected,
                totalOutstanding: dashboard.totalOutstanding,
                totalExpenses: dashboard.totalExpenses,
                netCashFlow: dashboard.netCashFlow,
            };
        }
        const s = filteredSummaries[0];
        if (!s) return { activeProjects: 0, totalBilled: 0, totalCollected: 0, totalOutstanding: 0, totalExpenses: 0, netCashFlow: 0 };
        return {
            activeProjects: s.status === 'in_progress' ? 1 : 0,
            totalBilled: s.billed,
            totalCollected: s.collected,
            totalOutstanding: s.outstanding,
            totalExpenses: s.expenses,
            netCashFlow: s.netCashFlow,
        };
    }, [dashboard, selectedProjectId, filteredSummaries, projects]);

    const kpiCards = useMemo(() => {
        const kv = kpiValues;
        return [
            {
                label: 'Active Projects',
                value: loadingDashboard ? null : kv ? (selectedProjectId === 'all' ? String(kv.activeProjects) : (kv.activeProjects > 0 ? 'Active' : 'Not active')) : 'N/A',
                sub: 'Projects where work is going on',
                tooltip: 'Projects currently in progress.',
            },
            {
                label: 'Total Invoiced',
                value: loadingDashboard ? null : kv ? formatCurrencyValue(kv.totalBilled) : 'N/A',
                sub: 'Total bill amount sent to customers',
                tooltip: 'Sum of all customer bills. Cancelled bills are not counted.',
            },
            {
                label: 'Amount Collected',
                value: loadingDashboard ? null : kv ? formatCurrencyValue(kv.totalCollected) : 'N/A',
                sub: 'Money received from customers',
                tooltip: 'Payments received from customers. Investor money is shown separately.',
            },
            {
                label: 'Amount Due',
                value: loadingDashboard ? null : kv ? formatCurrencyValue(kv.totalOutstanding) : 'N/A',
                sub: 'Customer payment still pending',
                tooltip: 'Bill amount still not paid by customers. Cancelled bills are not counted.',
            },
            {
                label: 'Total Expenses',
                value: loadingDashboard ? null : kv ? formatCurrencyValue(kv.totalExpenses) : 'N/A',
                sub: 'Total money spent so far',
                tooltip: 'All valid expense bills added till now. Cancelled entries are not counted.',
            },
            {
                label: 'Net Cash Flow',
                value: loadingDashboard ? null : kv ? formatCurrencyValue(kv.netCashFlow) : 'N/A',
                sub: 'Money in minus money out',
                tooltip: 'Customer collections minus expense payments till now. Cancelled entries are not counted.',
            },
        ];
    }, [kpiValues, loadingDashboard, selectedProjectId]);

    // ── Project Financial Summary rows (all projects, using dashboard summaries) ──
    type ProjectFinancialRow = DashboardProjectSummary & { projectValueLabel: string; displayValue: number };
    const projectFinancialRows = useMemo<ProjectFinancialRow[]>(() => {
        return (dashboard?.projectSummaries ?? []).map((summary) => {
            const projectRecord = projectById.get(summary.projectId);
            let displayValue = summary.contractValue;
            let projectValueLabel = 'Project value';
            if (summary.businessModel) {
                const modelKey = summary.businessModel as keyof typeof BUSINESS_MODEL_FORM_CONFIG;
                const modelConfig = BUSINESS_MODEL_FORM_CONFIG[modelKey in BUSINESS_MODEL_FORM_CONFIG ? modelKey : 'contract_construction'];
                projectValueLabel = modelConfig.contractValueLabel ?? 'Project value';
                if (summary.businessModel === 'property_development' && summary.projectedSalesValue > 0 && summary.contractValue === 0) {
                    displayValue = summary.projectedSalesValue;
                }
            } else if (projectRecord) {
                const meta = getProjectValueMeta(projectRecord);
                displayValue = meta.value;
                projectValueLabel = meta.label;
            }
            return { ...summary, displayValue, projectValueLabel };
        });
    }, [dashboard, projectById]);

    const visibleFinancialRows = useMemo(() => {
        if (selectedProjectId === 'all') return projectFinancialRows;
        return projectFinancialRows.filter((r) => r.projectId === selectedProjectId);
    }, [projectFinancialRows, selectedProjectId]);

    const projectColumns: Column<ProjectFinancialRow>[] = [
        {
            key: 'project',
            header: 'Project',
            width: 'w-[26%]',
            sortValue: (p) => p.projectName,
            cell: (p) => (
                <CellStack
                    title={<span className="block truncate" title={p.projectName} aria-label={p.projectName}>{p.projectName}</span>}
                    subtitle={p.projectValueLabel}
                />
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: 'w-[10%]',
            sortValue: (p) => formatStatus(p.status),
            cell: (p) => (
                <StatusPill
                    label={formatStatus(p.status)}
                    tone={p.status === 'completed' ? 'success' : p.status === 'on_hold' || p.status === 'cancelled' ? 'warning' : 'info'}
                />
            ),
        },
        {
            key: 'value',
            header: 'Value',
            align: 'right',
            width: 'w-[11%]',
            sortValue: (p) => p.displayValue,
            cell: (p) => <span className="whitespace-nowrap tabular-nums text-[var(--text)]">{formatCurrencyValue(p.displayValue)}</span>,
        },
        {
            key: 'budget',
            header: 'Budget',
            align: 'right',
            width: 'w-[11%]',
            sortValue: (p) => p.projectBudget,
            cell: (p) => <span className="whitespace-nowrap tabular-nums text-[var(--text)]">{p.projectBudget > 0 ? formatCurrencyValue(p.projectBudget) : <span className="text-[var(--text-muted)]">—</span>}</span>,
        },
        {
            key: 'expenses',
            header: 'Expenses',
            align: 'right',
            width: 'w-[11%]',
            sortValue: (p) => p.expenses,
            cell: (p) => <span className="whitespace-nowrap tabular-nums text-[var(--text)]">{formatCurrencyValue(p.expenses)}</span>,
        },
        {
            key: 'collected',
            header: 'Collected',
            align: 'right',
            width: 'w-[11%]',
            sortValue: (p) => p.collected,
            cell: (p) => <span className="whitespace-nowrap tabular-nums text-[var(--text)]">{formatCurrencyValue(p.collected)}</span>,
        },
        {
            key: 'outstanding',
            header: 'Due',
            align: 'right',
            width: 'w-[11%]',
            sortValue: (p) => p.outstanding,
            cell: (p) => <span className="whitespace-nowrap tabular-nums text-[var(--text)]">{formatCurrencyValue(p.outstanding)}</span>,
        },
        {
            key: 'budgetUtil',
            header: 'Budget Used',
            align: 'right',
            width: 'w-[9%]',
            sortValue: (p) => p.budgetUtilization ?? -1,
            cell: (p) => {
                if (p.budgetUtilization == null) return <span className="text-[var(--text-muted)]">—</span>;
                const pct = p.budgetUtilization;
                const tone = pct > 100 ? 'text-[var(--danger-fg)]' : pct > 80 ? 'text-[var(--warning-fg)]' : 'text-[var(--success)]';
                return <span className={`tabular-nums font-semibold ${tone}`}>{pct.toFixed(1)}%</span>;
            },
        },
    ];

    // ── Project Progress Overview ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visibleProgress = useMemo(() => {
        const rows = selectedProjectId === 'all'
            ? projectProgress
            : projectProgress.filter((r) => r.projectId === selectedProjectId);
        return rows.filter((r) => r.status !== 'cancelled');
    }, [projectProgress, selectedProjectId]);

    const visiblePendingSupplierPayments = useMemo(() => {
        return selectedProjectId === 'all'
            ? pendingSupplierPayments
            : pendingSupplierPayments.filter((row) => row.projectId === selectedProjectId);
    }, [pendingSupplierPayments, selectedProjectId]);

    // ── Management Attention alerts ──
    const managementAlerts = useMemo(() => {
        if (!dashboard) return [];
        const alerts: Array<{ key: string; icon: ReactNode; label: string; value: string; tone: 'warning' | 'danger' | 'info'; navigate: () => void }> = [];
        const scopedSummaries = selectedProjectId === 'all'
            ? (dashboard?.projectSummaries ?? [])
            : (dashboard?.projectSummaries ?? []).filter((s) => s.projectId === selectedProjectId);
        const scopedProgress = selectedProjectId === 'all'
            ? projectProgress
            : projectProgress.filter((p) => p.projectId === selectedProjectId);
        // 1. Projects exceeding available budget
        const overBudgetProjects = scopedSummaries.filter((s) => s.projectBudget > 0 && s.expenses > s.projectBudget);
        if (overBudgetProjects.length > 0) {
            const label = overBudgetProjects.length === 1
                ? `${overBudgetProjects[0].projectName} has exceeded its budget`
                : `${overBudgetProjects.length} projects have exceeded their budget`;
            alerts.push({
                key: 'over-budget',
                icon: <TrendingUp className="h-4 w-4" />,
                label,
                value: '',
                tone: 'warning',
                navigate: () => overBudgetProjects.length === 1 ? navigate(`/projects/${overBudgetProjects[0].projectId}`) : navigate('/projects'),
            });
        }

        // 2. Projects past expected completion date
        const overdueProjects = scopedSummaries.filter((s) => {
            if (!s.expectedEndDate || s.status === 'completed' || s.status === 'cancelled') return false;
            const end = new Date(s.expectedEndDate);
            return !Number.isNaN(end.getTime()) && end < today;
        });
        if (overdueProjects.length > 0) {
            const label = overdueProjects.length === 1
                ? `${overdueProjects[0].projectName} is past expected completion date`
                : `${overdueProjects.length} projects are past their expected completion date`;
            alerts.push({
                key: 'overdue-completion',
                icon: <AlertTriangle className="h-4 w-4" />,
                label,
                value: '',
                tone: 'warning',
                navigate: () => overdueProjects.length === 1 ? navigate(`/projects/${overdueProjects[0].projectId}`) : navigate('/projects'),
            });
        }

        // 3. In-progress projects without progress updates in the last 30 days
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const staleProgressProjects = scopedProgress.filter((p) => {
            if (p.status !== 'in_progress') return false;
            if (!p.latestProgressDate) return true; // no updates at all
            const lastUpdate = new Date(p.latestProgressDate);
            return !Number.isNaN(lastUpdate.getTime()) && lastUpdate < thirtyDaysAgo;
        });
        if (staleProgressProjects.length > 0) {
            alerts.push({
                key: 'stale-progress',
                icon: <TrendingDown className="h-4 w-4" />,
                label: `${staleProgressProjects.length} active project${staleProgressProjects.length !== 1 ? 's' : ''} with no construction progress update in 30 days`,
                value: '',
                tone: 'info',
                navigate: () => navigate('/projects'),
            });
        }

        return alerts;
    }, [dashboard, projectProgress, navigate, selectedProjectId]);

    const maxMonthlyValue = monthlyChartData.length > 0
        ? monthlyChartData.reduce((max, entry) => Math.max(max, entry.billed, entry.collected, entry.expenses), 0)
        : 0;

    const monthlyAxisTicks = useMemo(() => {
        if (maxMonthlyValue <= 0) return [0];
        const mid = maxMonthlyValue / 2;
        return [maxMonthlyValue, mid, 0];
    }, [maxMonthlyValue]);

    const chartMonthLabel = (monthValue: string) => {
        if (!monthValue) return '—';
        const date = new Date(`${monthValue}-01T00:00:00`);
        if (Number.isNaN(date.getTime())) return monthValue;
        return date.toLocaleDateString(undefined, { month: 'short' });
    };

    const projectFilterOptions: { label: string; value: ProjectDashboardFilter }[] = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Planned', value: 'planned' },
        { label: 'Completed', value: 'completed' },
    ];

    const selectedProjectRecord = isAllProjectsView ? null : projectById.get(selectedProjectId) ?? null;
    const selectedProjectValueMeta = selectedProjectSummary
        ? getProjectValueMeta(selectedProjectSummary)
        : selectedProjectRecord
            ? getProjectValueMeta(selectedProjectRecord)
            : null;

    const needsAttentionCount = dashboard
        ? (selectedProjectId === 'all'
            ? Number(dashboard.projectsAtRisk ?? 0)
            : (managementAlerts.length > 0 ? 1 : 0))
        : null;

    const amountDueNumber = dashboard ? Number(kpiValues?.totalOutstanding ?? 0) : null;
    const supplierDueNumber = dashboard
        ? visiblePendingSupplierPayments.reduce((sum, row) => sum + Number(row.outstanding ?? 0), 0)
        : null;

    const projectHealthSnapshot: SnapshotMetric[] = [
        {
            label: 'Total Projects',
            value: dashboard
                ? (selectedProjectId === 'all' ? String(dashboard.projectsCount ?? projects.length) : '1')
                : 'N/A',
            tone: 'info',
            icon: <FolderKanban className="h-4 w-4 text-[var(--primary)]" />,
        },
        {
            label: 'Completed',
            value: dashboard
                ? (selectedProjectId === 'all'
                    ? String(projects.filter((p) => p.status === 'completed').length)
                    : String(selectedProjectRecord?.status === 'completed' ? 1 : 0))
                : 'N/A',
            tone: 'success',
            icon: <CalendarClock className="h-4 w-4 text-[var(--success)]" />,
        },
        {
            label: 'Planned',
            value: dashboard
                ? (selectedProjectId === 'all'
                    ? String(projects.filter((p) => p.status === 'planned').length)
                    : String(selectedProjectRecord?.status === 'planned' ? 1 : 0))
                : 'N/A',
            tone: 'neutral',
            icon: <CalendarClock className="h-4 w-4 text-[var(--primary)]" />,
        },
        {
            label: 'Needs Attention',
            value: needsAttentionCount == null ? 'N/A' : String(needsAttentionCount),
            tone: needsAttentionCount != null && needsAttentionCount > 0 ? 'warning' : 'success',
            icon: <WalletCards className="h-4 w-4 text-[var(--warning-fg)]" />,
        },
    ];

    const cashPositionSnapshot: SnapshotMetric[] = [
        {
            label: 'Amount Due',
            value: amountDueNumber == null ? 'N/A' : formatCurrencyValue(amountDueNumber),
            tone: amountDueNumber != null && amountDueNumber > 0 ? 'warning' : 'success',
            icon: <Wallet className="h-4 w-4 text-[var(--warning-fg)]" />,
        },
        {
            label: 'Supplier Payments Due',
            value: supplierDueNumber == null ? 'N/A' : formatCurrencyValue(supplierDueNumber),
            tone: supplierDueNumber != null && supplierDueNumber > 0 ? 'danger' : 'success',
            icon: <WalletCards className="h-4 w-4 text-[var(--danger-fg)]" />,
        },
    ];

    // Projects list sidebar: filter + sort by risk
    const visibleProjectsSidebar = useMemo(() => {
        const filtered = projects.filter((project) => {
            if (projectFilter === 'all') return true;
            if (projectFilter === 'active') return project.status === 'in_progress';
            if (projectFilter === 'planned') return project.status === 'planned';
            return project.status === 'completed';
        });

        return filtered.map((project) => {
            const summary = projectSummaryMap.get(project.id);
            const customerOutstanding = Number(summary?.outstanding ?? 0);
            const actualCost = Number(summary?.expenses ?? 0);
            const projectBudget = Number(summary?.projectBudget ?? project.budgetAmount ?? 0);
            const isOverBudget = projectBudget > 0 && actualCost > projectBudget;
            const hasOverdueExpected = summary?.expectedEndDate && project.status !== 'completed' && project.status !== 'cancelled'
                ? new Date(summary.expectedEndDate) < today
                : false;
            const recency = project.updatedAt ? new Date(project.updatedAt).getTime() : (project.createdAt ? new Date(project.createdAt).getTime() : 0);
            return {
                ...project,
                customerOutstanding,
                actualCost,
                projectBudget,
                isOverBudget,
                hasOverdueExpected,
                priority: customerOutstanding > 0 ? 0 : isOverBudget ? 1 : hasOverdueExpected ? 2 : 3,
                recency,
            };
        })
            .sort((a, b) => {
                const priorityDiff = a.priority - b.priority;
                if (priorityDiff !== 0) return priorityDiff;
                return b.recency - a.recency;
            })
            .slice(0, 5);
    }, [projects, projectFilter, projectSummaryMap]);

    return (
        <div className="space-y-3.5 print:space-y-2 lg:space-y-4">
            <PageHeader
                compact
                title="Dashboard"
                description={
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm">
                        <span>Live summary of projects, billing, expenses and collections.</span>
                        {(loadingDashboard || loadingTransactions) && <span className="ml-2"><InlineLoader label="Refreshing…" /></span>}
                        {syncedAt && !loadingDashboard && (
                            <span className="whitespace-nowrap text-xs font-medium text-[var(--text-muted)]">Last synced {formatDate(syncedAt)}</span>
                        )}
                    </div>
                }
                actions={
                    <>
                        <AppButton className="h-9 px-3" variant="secondary" onClick={() => void Promise.all([loadDashboard(selectedProjectId), loadTransactions({ from, to })])} loading={loadingDashboard || loadingTransactions} loadingText="Refreshing…">
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </AppButton>
                        <AppButton className="h-9 px-3" variant="secondary" onClick={() => navigate('/reports')}>
                            <BarChart3 className="h-4 w-4" />
                            Open reports
                        </AppButton>
                        <AppButton className="h-9 px-3" onClick={openCreateProject}>
                            <Plus className="h-4 w-4" />
                            New project
                        </AppButton>
                    </>
                }
            />

            {error && (
                <div role="alert" className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-fg)]">{error}</div>
            )}

            {/* ── A. Global Filters ── */}
            <PremiumCard className="px-3.5 py-3 print:break-inside-avoid sm:px-4">
                <div className="flex flex-wrap items-end gap-2.5">
                    <div className="flex min-w-[220px] flex-1 flex-col gap-1 lg:max-w-[340px]">
                        <label htmlFor="project-selector" className="text-xs font-medium text-[var(--text-muted)]">Project</label>
                        <select
                            id="project-selector"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        >
                            <option value="all">All Projects</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex min-w-[144px] flex-col gap-1">
                        <label htmlFor="from-date" className="text-xs font-medium text-[var(--text-muted)]">From</label>
                        <input
                            id="from-date"
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                    </div>
                    <div className="flex min-w-[144px] flex-col gap-1">
                        <label htmlFor="to-date" className="text-xs font-medium text-[var(--text-muted)]">To</label>
                        <input
                            id="to-date"
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                    </div>
                    <div className="flex gap-2">
                        <AppButton
                            className="h-9 min-w-[88px]"
                            variant="secondary"
                            onClick={handleApplyFilters}
                            loading={loadingTransactions}
                            disabled={!isDateRangeValid || !hasDateRangeChanged || loadingTransactions}
                        >
                            <CalendarClock className="h-4 w-4" aria-hidden="true" />
                            Apply
                        </AppButton>
                    </div>
                </div>
                <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                    Date filter applies only to recent transactions. KPI cards and project summary show overall totals.
                    {(from || to) && (
                        <button type="button" onClick={handleResetFilters} className="ml-2 font-medium text-[var(--primary)] hover:underline">
                            Reset dates
                        </button>
                    )}
                </p>
            </PremiumCard>

            {/* ── B. KPI Cards ── */}
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
                {kpiCards.map((card) => (
                    <div key={card.label} title={card.tooltip}>
                        <StatCardButton
                            label={card.label}
                            value={card.value ?? '…'}
                            sub={card.sub}
                            icon={kpiIcons[card.label] ?? <IndianRupee className="h-5 w-5 text-[var(--primary)]" />}
                            iconTone={kpiIconTones[card.label] ?? 'bg-[var(--primary-soft)] text-[var(--primary)]'}
                            className="h-full [&>div]:min-h-[148px] [&>div]:rounded-xl [&>div]:border-[var(--border)] [&>div]:p-2.5 [&>div]:shadow-sm [&>div>p:first-child]:text-[11px] [&>div>p:first-child]:tracking-[0.01em] [&>div>div:nth-child(2)>p]:text-xl [&>div>div:nth-child(2)>p]:leading-tight [&>div>p:last-child]:min-h-[2rem]"
                            onClick={() => navigate('/reports')}
                        />
                    </div>
                ))}
            </div>

            {/* ── C. Project Financial Summary ── */}
            <div className="grid grid-cols-1 gap-4">
                <PremiumCard className="self-start overflow-hidden print:break-inside-avoid">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                                <FolderKanban className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                                {isAllProjectsView ? 'Project-wise Summary' : 'Selected Project Overview'}
                            </h2>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                {isAllProjectsView
                                    ? 'Project value, expenses and collections across all projects.'
                                    : 'Financial and project summary for the selected project.'}
                            </p>
                        </div>
                    </div>
                    {isAllProjectsView ? (
                        <DataTable
                            bare
                            dense
                            mobileLayout="cards"
                            className="project-summary-table"
                            caption="Project-wise Summary"
                            columns={projectColumns}
                            rows={visibleFinancialRows}
                            rowKey={(p) => p.projectId}
                            onRowClick={(p) => navigate(`/projects/${p.projectId}`)}
                            empty={{ title: 'No projects added yet', description: 'Project value, expenses and collections will appear here once you add projects.' }}
                        />
                    ) : selectedProjectSummary ? (
                        <div className="grid gap-2 p-4 sm:grid-cols-2">
                            <SnapshotRow
                                icon={<FolderKanban className="h-4 w-4 text-[var(--primary)]" />}
                                label="Project"
                                value={selectedProjectSummary.projectName}
                            />
                            <SnapshotRow
                                icon={<CalendarClock className="h-4 w-4 text-[var(--primary)]" />}
                                label="Status"
                                value={formatStatus(selectedProjectSummary.status)}
                            />
                            <SnapshotRow
                                icon={<IndianRupee className="h-4 w-4 text-[var(--primary)]" />}
                                label={selectedProjectValueMeta?.label ?? 'Project value'}
                                value={formatCurrencyValue(selectedProjectValueMeta?.value ?? selectedProjectSummary.contractValue)}
                            />
                            <SnapshotRow
                                icon={<IndianRupee className="h-4 w-4 text-[var(--primary)]" />}
                                label="Budget"
                                value={selectedProjectSummary.projectBudget > 0 ? formatCurrencyValue(selectedProjectSummary.projectBudget) : '—'}
                            />
                            <SnapshotRow
                                icon={<Wallet className="h-4 w-4 text-[var(--success)]" />}
                                label="Amount Collected"
                                value={formatCurrencyValue(selectedProjectSummary.collected)}
                            />
                            <SnapshotRow
                                icon={<WalletCards className="h-4 w-4 text-[var(--warning-fg)]" />}
                                label="Amount Due"
                                value={formatCurrencyValue(selectedProjectSummary.outstanding)}
                            />
                            <SnapshotRow
                                icon={<WalletCards className="h-4 w-4 text-[var(--danger-fg)]" />}
                                label="Total Expenses"
                                value={formatCurrencyValue(selectedProjectSummary.expenses)}
                            />
                            <SnapshotRow
                                icon={<BarChart3 className="h-4 w-4 text-[var(--primary)]" />}
                                label="Net Cash Flow"
                                value={formatCurrencyValue(selectedProjectSummary.netCashFlow)}
                            />
                        </div>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                icon={<FolderKanban className="h-6 w-6" />}
                                title="Project summary unavailable"
                                description="This project does not have enough data to render an overview yet."
                            />
                        </div>
                    )}
                </PremiumCard>

                <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-1">
                    <PremiumCard className="min-w-0 self-start p-4 print:break-inside-avoid">
                        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                            <ClipboardList className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                            Project snapshot
                        </h2>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">Quick view of project health, money status and next action.</p>

                        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Project Health</h3>
                                <StatusPill label={needsAttentionCount != null && needsAttentionCount > 0 ? 'Watchlist' : 'Stable'} tone={needsAttentionCount != null && needsAttentionCount > 0 ? 'warning' : 'success'} />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {projectHealthSnapshot.map((item) => (
                                    <SnapshotMetricCard key={item.label} item={item} />
                                ))}
                            </div>
                        </div>

                        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Cash Position</h3>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {cashPositionSnapshot.map((item) => (
                                    <SnapshotMetricCard key={item.label} item={item} />
                                ))}
                            </div>
                        </div>

                        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {needsAttentionCount != null && needsAttentionCount > 0
                                        ? `${needsAttentionCount} item${needsAttentionCount !== 1 ? 's' : ''} need follow-up action.`
                                        : 'All tracked items look healthy right now.'}
                                </p>
                                <AppButton variant="secondary" className="h-8 px-3" onClick={() => navigate('/projects')}>
                                    Review projects
                                </AppButton>
                            </div>
                        </div>
                    </PremiumCard>
                </div>
            </div>

            {/* ── D. Monthly Financial Performance ── */}
            <div className="grid gap-4 xl:grid-cols-2">
                {/* ── E. Project Progress Overview ── */}
                <PremiumCard className="min-w-0 overflow-hidden print:break-inside-avoid">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                                <HardHat className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                                Construction Progress
                            </h2>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">Current construction stage and work completed by project.</p>
                        </div>
                        <button type="button" onClick={() => navigate('/projects')} className="shrink-0 rounded-md text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                            View all
                        </button>
                    </div>

                    {loadingDashboard ? (
                        <div className="divide-y divide-[var(--border)]" aria-busy="true">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                                    <div className="space-y-2">
                                        <SkeletonRow className="h-4 w-40" />
                                        <SkeletonRow className="h-3 w-28" />
                                    </div>
                                    <SkeletonRow className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : visibleProgress.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={<FolderKanban className="h-6 w-6" />}
                                title="No progress recorded yet"
                                description="Add construction stages and progress updates to track work completion."
                            />
                        </div>
                    ) : (
                        <ol className="divide-y divide-[var(--border)]">
                            {visibleProgress.slice(0, 6).map((prog) => {
                                const isOverdue = prog.expectedEndDate && prog.status !== 'completed'
                                    ? new Date(prog.expectedEndDate) < today
                                    : false;
                                const hasNoRecentUpdate = prog.status === 'in_progress' && (
                                    !prog.latestProgressDate || new Date(prog.latestProgressDate) < new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                                );
                                const progressPercent = typeof prog.progressPercent === 'number'
                                    ? Math.max(0, Math.min(100, prog.progressPercent))
                                    : null;
                                const progressTone = progressPercent == null
                                    ? 'text-[var(--text-muted)]'
                                    : progressPercent >= 80
                                        ? 'text-[var(--success)]'
                                        : progressPercent >= 40
                                            ? 'text-[var(--primary)]'
                                            : 'text-[var(--warning-fg)]';
                                return (
                                    <li key={prog.projectId}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/projects/${prog.projectId}`)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-[var(--text)]">{prog.projectName}</p>
                                                    {isOverdue && <StatusPill label="Delayed" tone="warning" />}
                                                    {hasNoRecentUpdate && <StatusPill label="No update" tone="neutral" />}
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                    <StatusPill
                                                        label={prog.currentStageName ? `Current stage: ${prog.currentStageName}` : 'Current stage: Not set'}
                                                        tone="info"
                                                    />
                                                    {prog.expectedEndDate && (
                                                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                                                            Expected completion {formatDate(prog.expectedEndDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {progressPercent != null ? (
                                                    <div className="flex min-w-[110px] flex-col items-end gap-1">
                                                        <span className={`text-base font-bold tabular-nums ${progressTone}`}>{progressPercent}%</span>
                                                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--surface-muted)]" aria-hidden="true">
                                                            <div
                                                                className={`h-full rounded-full ${progressPercent >= 80 ? 'bg-[var(--success)]' : progressPercent >= 40 ? 'bg-[var(--primary)]' : 'bg-[var(--warning-fg)]'}`}
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">progress</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[var(--text-muted)]">—</span>
                                                )}
                                            </div>
                                            <ChevronRight className="hidden h-4 w-4 shrink-0 text-[var(--text-subtle)] sm:block" aria-hidden="true" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </PremiumCard>

                <PremiumCard className="overflow-hidden print:break-inside-avoid">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                                <BarChart3 className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                                Monthly Income & Expenses
                            </h2>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                {isAllProjectsView
                                    ? 'Last 6 months — invoiced, collected and expenses (all projects combined).'
                                    : 'Last 6 months — invoiced, collected and expenses for the selected project.'}
                            </p>
                        </div>
                        <button type="button" onClick={() => navigate('/reports')} className="shrink-0 rounded-md text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                            View report
                        </button>
                    </div>

                    {loadingDashboard ? (
                        <div className="p-5" aria-busy="true" aria-label="Loading monthly chart">
                            <div className="flex h-44 items-end gap-3">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex-1">
                                        <SkeletonRow className="h-24 w-full rounded-t-lg" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : monthlyChartData.length === 0 ? (
                        <div className="p-5 text-sm text-[var(--text-muted)]">No monthly data recorded yet.</div>
                    ) : (
                        <div className="p-5">
                            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-1)]" />Total Invoiced</span>
                                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-2)]" />Amount Collected</span>
                                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-3)]" />Total Expenses</span>
                            </div>
                            {maxMonthlyValue === 0 && (
                                <p className="mb-3 text-xs text-[var(--text-muted)]">No invoices, collections or expenses recorded in the last six months.</p>
                            )}
                            <div className="flex gap-3">
                                <div className="hidden h-48 w-16 shrink-0 flex-col justify-between pb-6 pt-1 text-right text-[10px] tabular-nums text-[var(--text-muted)] sm:flex">
                                    {monthlyAxisTicks.map((tick, index) => (
                                        <span key={`tick-${index}`}>{formatINR(tick)}</span>
                                    ))}
                                </div>
                                <div className="relative flex h-48 flex-1 items-end gap-3">
                                    <span className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-[var(--border)]" aria-hidden="true" />
                                    <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--border)]" aria-hidden="true" />
                                    <span className="pointer-events-none absolute inset-x-0 bottom-6 border-t border-[var(--border)]" aria-hidden="true" />
                                    {monthlyChartData.map((entry) => {
                                        const billedHeight = maxMonthlyValue > 0 ? (entry.billed / maxMonthlyValue) * 100 : 0;
                                        const collectedHeight = maxMonthlyValue > 0 ? (entry.collected / maxMonthlyValue) * 100 : 0;
                                        const expenseHeight = maxMonthlyValue > 0 ? (entry.expenses / maxMonthlyValue) * 100 : 0;
                                        const monthTotal = entry.billed + entry.collected + entry.expenses;
                                        return (
                                            <div key={`${entry.month}-chart`} className="z-[1] flex min-w-0 flex-1 flex-col items-center gap-2">
                                                <div className="hidden h-4 text-[10px] font-medium tabular-nums text-[var(--text-muted)] sm:block" title={`Total activity ${formatINR(monthTotal)}`}>
                                                    {monthTotal > 0 ? formatINR(monthTotal) : ''}
                                                </div>
                                                <div className="flex h-[calc(100%-1.5rem)] w-full items-end justify-center gap-1" aria-label={`${chartMonthLabel(entry.month)} invoiced ${formatINR(entry.billed)}, collected ${formatINR(entry.collected)}, expenses ${formatINR(entry.expenses)}`}>
                                                    <span className="block w-1/3 rounded-t-md bg-[var(--chart-1)] opacity-85" style={{ height: `${billedHeight}%` }} title={`Invoiced ${formatINR(entry.billed)}`} />
                                                    <span className="block w-1/3 rounded-t-md bg-[var(--chart-2)] opacity-85" style={{ height: `${collectedHeight}%` }} title={`Collected ${formatINR(entry.collected)}`} />
                                                    <span className="block w-1/3 rounded-t-md bg-[var(--chart-3)] opacity-85" style={{ height: `${expenseHeight}%` }} title={`Expenses ${formatINR(entry.expenses)}`} />
                                                </div>
                                                <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{chartMonthLabel(entry.month)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </PremiumCard>

                <div className="grid gap-4 print:break-inside-avoid xl:col-span-2 xl:grid-cols-2">
                    {/* Projects sidebar — retains the original project list card */}
                    <PremiumCard className="min-w-0 overflow-hidden print:break-inside-avoid">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                                    <Building2 className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                                    {isAllProjectsView ? 'Projects' : 'Project Details'}
                                </h2>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    {isAllProjectsView ? 'Sorted by overdue payments and budget overruns.' : 'Operational details for the selected project.'}
                                </p>
                            </div>
                            {isAllProjectsView ? (
                                <button type="button" onClick={() => navigate('/projects')} className="shrink-0 rounded-md text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                                    View all
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedProjectRecord) navigate(`/projects/${selectedProjectRecord.id}`);
                                    }}
                                    className="shrink-0 rounded-md text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                >
                                    Open project
                                </button>
                            )}
                        </div>

                        {isAllProjectsView ? (
                            <>
                                <div className="border-b border-[var(--border)] px-4 py-2.5">
                                    <div className="flex flex-wrap gap-2">
                                        {projectFilterOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setProjectFilter(option.value)}
                                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${projectFilter === option.value ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {loadingDashboard ? (
                                    <div className="divide-y divide-[var(--border)]" aria-busy="true" aria-label="Loading projects">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                                                <div className="space-y-2">
                                                    <SkeletonRow className="h-4 w-40" />
                                                    <SkeletonRow className="h-3 w-28" />
                                                </div>
                                                <SkeletonRow className="h-4 w-20" />
                                            </div>
                                        ))}
                                    </div>
                                ) : visibleProjectsSidebar.length === 0 ? (
                                    <div className="p-5">
                                        <EmptyState
                                            icon={<FolderKanban className="h-6 w-6" />}
                                            title="No projects found"
                                            description="No projects match this filter."
                                            action={
                                                <AppButton variant="secondary" onClick={openCreateProject}>
                                                    <Plus className="h-4 w-4" />
                                                    New project
                                                </AppButton>
                                            }
                                        />
                                    </div>
                                ) : (
                                    <ol className="divide-y divide-[var(--border)]">
                                        {visibleProjectsSidebar.map((project, index) => (
                                            <li key={project.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/projects/${project.id}`)}
                                                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                                                >
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-secondary)]" aria-hidden="true">
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="truncate text-sm font-semibold text-[var(--text)]">{project.name}</p>
                                                            {project.customerOutstanding > 0 && project.priority === 0 && <StatusPill label="Payment due" tone="warning" />}
                                                            {project.isOverBudget && <StatusPill label="Over budget" tone="warning" />}
                                                            {project.hasOverdueExpected && !project.isOverBudget && <StatusPill label="Delayed" tone="warning" />}
                                                        </div>
                                                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                                            {project.projectTypeSnapshot || 'General'} • {formatStatus(project.status)}
                                                        </p>
                                                    </div>
                                                    <div className="hidden shrink-0 text-right sm:block">
                                                        <p className="text-xs text-[var(--text-muted)]">
                                                            {project.customerOutstanding > 0
                                                                ? `${formatCurrencyValue(project.customerOutstanding)} due`
                                                                : project.actualCost > 0
                                                                    ? `${formatCurrencyValue(project.actualCost)} spent`
                                                                    : 'No activity yet'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="hidden h-4 w-4 shrink-0 text-[var(--text-subtle)] sm:block" aria-hidden="true" />
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </>
                        ) : (
                            <div className="space-y-2 p-4">
                                <SnapshotRow
                                    icon={<FolderKanban className="h-4 w-4 text-[var(--primary)]" />}
                                    label="Project Type"
                                    value={selectedProjectRecord?.projectTypeSnapshot || 'General'}
                                />
                                <SnapshotRow
                                    icon={<CalendarClock className="h-4 w-4 text-[var(--primary)]" />}
                                    label="Expected Completion"
                                    value={selectedProjectSummary?.expectedEndDate ? formatDate(selectedProjectSummary.expectedEndDate) : 'Not set'}
                                />
                                <SnapshotRow
                                    icon={<WalletCards className="h-4 w-4 text-[var(--danger-fg)]" />}
                                    label="Budget Utilization"
                                    value={selectedProjectSummary?.budgetUtilization != null ? `${selectedProjectSummary.budgetUtilization.toFixed(1)}%` : '—'}
                                />
                                <SnapshotRow
                                    icon={<Wallet className="h-4 w-4 text-[var(--warning-fg)]" />}
                                    label="Supplier Payments Due"
                                    value={formatCurrencyValue(visiblePendingSupplierPayments.reduce((sum, row) => sum + Number(row.outstanding ?? 0), 0))}
                                />
                            </div>
                        )}
                    </PremiumCard>

                    {/* ── F. Management Attention ── */}
                    <PremiumCard className="overflow-hidden print:break-inside-avoid">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                                    <AlertTriangle className="h-4 w-4 text-[var(--warning-fg)]" aria-hidden="true" />
                                    Needs Attention
                                </h2>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">Items that need follow-up action.</p>
                            </div>
                            {managementAlerts.length > 0 && (
                                <StatusPill label={`${managementAlerts.length} item${managementAlerts.length !== 1 ? 's' : ''}`} tone="warning" />
                            )}
                        </div>

                        {loadingDashboard ? (
                            <div className="divide-y divide-[var(--border)] px-4 py-1.5">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="flex items-center justify-between gap-4 py-2.5">
                                        <SkeletonRow className="h-4 w-64" />
                                        <SkeletonRow className="h-4 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : managementAlerts.length === 0 ? (
                            <div className="p-5 text-sm text-[var(--text-muted)]">
                                All projects are on track. Nothing needs attention right now.
                            </div>
                        ) : (
                            <ol className="divide-y divide-[var(--border)]">
                                {managementAlerts.map((alert) => (
                                    <li key={alert.key}>
                                        <button
                                            type="button"
                                            onClick={alert.navigate}
                                            className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${alert.tone === 'danger' ? 'bg-[var(--danger-soft)] text-[var(--danger-fg)]' : alert.tone === 'warning' ? 'bg-[color-mix(in_oklab,var(--warning)_18%,white)] text-[var(--warning-fg)]' : 'bg-[var(--primary-soft)] text-[var(--primary)]'}`}>
                                                    {alert.icon}
                                                </span>
                                                <span className="text-sm leading-5 text-[var(--text)]">{alert.label}</span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-3">
                                                {alert.value && (
                                                    <span className="text-sm font-semibold tabular-nums text-[var(--text)]">{alert.value}</span>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-[var(--text-subtle)]" aria-hidden="true" />
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </PremiumCard>
                </div>
            </div>

            {/* ── G. Recent Transactions ── */}
            <PremiumCard className="overflow-hidden print:break-inside-avoid">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                            <ReceiptText className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                            Recent transactions
                        </h2>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">Selected-period activity: customer receipts, expense bills and investor contributions.</p>
                    </div>
                    <button type="button" onClick={() => navigate('/reports')} className="shrink-0 rounded-md text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                        View all
                    </button>
                </div>

                {transactionError && (
                    <div role="alert" className="border-b border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-2.5 text-sm text-[var(--danger-fg)]">{transactionError}</div>
                )}

                {loadingTransactions ? (
                    <div className="divide-y divide-[var(--border)] px-4 py-1.5" aria-busy="true" aria-label="Loading transactions">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between gap-4 py-2.5">
                                <div className="space-y-2">
                                    <SkeletonRow className="h-4 w-44" />
                                    <SkeletonRow className="h-3 w-28" />
                                </div>
                                <SkeletonRow className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                ) : recentTransactions.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon={<Wallet className="h-6 w-6" />}
                            title="No transactions yet"
                            description="Record a new receipt or expense to populate this feed."
                            action={
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <AppButton variant="secondary" onClick={() => navigate('/reports')}>
                                        <BarChart3 className="h-4 w-4" />
                                        Open reports
                                    </AppButton>
                                    <AppButton onClick={() => navigate('/expenses')}>
                                        <WalletCards className="h-4 w-4" />
                                        Add expense
                                    </AppButton>
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <ol className="divide-y divide-[var(--border)]">
                        {recentTransactions.map((row) => (
                            <li key={row.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (row.projectId) {
                                            navigate(`/projects/${row.projectId}`);
                                            return;
                                        }
                                        navigate(row.kind === 'expense' ? '/expenses' : '/reports');
                                    }}
                                    className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${row.kind === 'investment' ? 'bg-[var(--primary)]' : row.kind === 'collection' ? 'bg-[var(--success)]' : 'bg-[var(--danger-fg)]'}`} aria-hidden="true" />
                                            <p className="truncate text-sm font-semibold text-[var(--text)]">{row.reference}</p>
                                            <StatusPill
                                                label={row.kind === 'collection' ? 'Collection' : row.kind === 'investment' ? 'Investment' : 'Expense'}
                                                tone={row.kind === 'collection' ? 'success' : 'info'}
                                            />
                                            {row.isCompanyLevel && <StatusPill label="Company-level" tone="neutral" />}
                                            {dateValue(row.occurredOn) > Date.now() && <StatusPill label="Future date" tone="warning" />}
                                        </div>
                                        <p className="mt-0.5 truncate text-xs leading-4 text-[var(--text-muted)]">
                                            {row.counterparty} • {row.projectName} • {row.occurredOn ? `${formatDate(row.occurredOn)} ${formatTime(row.occurredOn)}` : 'Date not set'}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold tabular-nums ${row.kind === 'investment' ? 'text-[var(--primary)]' : row.kind === 'collection' ? 'text-[var(--success)]' : 'text-[var(--danger-fg)]'}`}>
                                                {row.kind === 'expense' ? '-' : '+'} {formatINR(row.amount)}
                                            </p>
                                            <StatusPill label={row.kind === 'investment' ? 'Investor' : row.statusLabel} tone={row.statusTone} />
                                        </div>
                                        <ChevronRight className="hidden h-4 w-4 text-[var(--text-subtle)] sm:block" aria-hidden="true" />
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ol>
                )}
            </PremiumCard>
        </div>
    );
}

function SnapshotRow({ icon, label, value }: { icon: ReactNode; label: string; value: string | null }) {
    return (
        <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
                <span className="truncate">{label}</span>
            </div>
            {value === null ? (
                <SkeletonRow className="h-4 w-16" />
            ) : (
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text)]">{value}</span>
            )}
        </div>
    );
}

function SnapshotMetricCard({ item }: { item: SnapshotMetric }) {
    const toneClass = item.tone === 'danger'
        ? 'text-[var(--danger-fg)]'
        : item.tone === 'warning'
            ? 'text-[var(--warning-fg)]'
            : item.tone === 'success'
                ? 'text-[var(--success)]'
                : 'text-[var(--text)]';

    return (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    {item.icon}
                    <span>{item.label}</span>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${toneClass}`}>{item.value}</span>
            </div>
        </div>
    );
}
