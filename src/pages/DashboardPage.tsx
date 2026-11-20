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
    getDefaultersReport,
    getExpensesReport,
    getMonthlyFinancialReport,
    getProjectFinancials,
    type CollectionReportRow,
    type CompanyReceiptRow,
    type DashboardReport,
    type DefaulterReportRow,
    type ExpenseReportRow,
    type MonthlyFinancialEntry,
} from '@/services/report.service';
import {
    BarChart3,
    CalendarClock,
    ChevronRight,
    FolderKanban,
    IndianRupee,
    Plus,
    RefreshCcw,
    Wallet,
    WalletCards
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const formatStatus = (status: string) => {
    const label = status.replace(/_/g, ' ');
    return label.charAt(0).toUpperCase() + label.slice(1);
};

// One icon per KPI card (instead of the same rupee icon on all six).
const kpiIcons: Record<string, ReactNode> = {
    'Active Projects': <FolderKanban className="h-5 w-5 text-[var(--primary)]" />,
    'Total Billed': <IndianRupee className="h-5 w-5 text-[var(--primary)]" />,
    'Collected': <Wallet className="h-5 w-5 text-[var(--primary)]" />,
    'Outstanding': <CalendarClock className="h-5 w-5 text-[var(--primary)]" />,
    'Actual Expenses': <WalletCards className="h-5 w-5 text-[var(--primary)]" />,
    'Net Cash Flow': <BarChart3 className="h-5 w-5 text-[var(--primary)]" />,
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
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [projectMetrics, setProjectMetrics] = useState<Record<string, {
        contractValue: number;
        projectBudget: number;
        actualCost: number;
        customerCollections: number;
        investorContributions: number;
        expectedProjectMargin: number | null;
        cashBasedProfitLoss: number;
        budgetRemaining: number;
        budgetUtilization: number;
        netCashFlow: number;
    }>>({});
    const [monthlySeries, setMonthlySeries] = useState<MonthlyFinancialEntry[]>([]);
    const [defaulters, setDefaulters] = useState<DefaulterReportRow[]>([]);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [syncedAt, setSyncedAt] = useState<string | null>(null);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
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

    const projectById = useMemo(
        () => new Map(projects.map((project) => [project.id, project])),
        [projects],
    );

    const formatCurrencyValue = (value: number | null | undefined) => {
        if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
        if (!Number.isFinite(value)) return 'N/A';
        return formatINR(value);
    };

    const getProjectValueMeta = (project: ProjectRecord) => {
        const modelConfig = BUSINESS_MODEL_FORM_CONFIG[project.businessModel ?? 'contract_construction'];
        const contractValue = Number(project.contractAmount ?? 0);
        const projectedSales = Number(project.projectedSalesValue ?? 0);
        const valueForDisplay = project.businessModel === 'property_development' && projectedSales > 0 && contractValue === 0
            ? projectedSales
            : contractValue;

        return {
            label: project.businessModel ? modelConfig.contractValueLabel : 'Project value',
            value: valueForDisplay,
            display: formatCurrencyValue(valueForDisplay),
        };
    };

    const loadDashboard = async () => {
        setLoadingDashboard(true);
        setError(null);
        try {
            const [dashboardData, projectRows, monthlyData, defaulterRows] = await Promise.all([
                getDashboardReport(),
                listProjects(),
                getMonthlyFinancialReport(),
                getDefaultersReport(),
            ]);

            if (!dashboardData) {
                setError('Unable to load dashboard totals right now.');
            }

            setDashboard(dashboardData);
            setProjects(projectRows);
            setMonthlySeries(monthlyData?.monthly ?? []);
            setDefaulters(defaulterRows);
            setSyncedAt(new Date().toISOString());
        } catch (err) {
            console.error(err);
            setError('Unable to load dashboard totals right now.');
            setDashboard(null);
            setProjects([]);
            setMonthlySeries([]);
            setDefaulters([]);
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

        try {
            const [expenseReport, collectionReport, companyReceipts] = await Promise.all([
                getExpensesReport({ from: fromValue || undefined, to: toValue || undefined }),
                getCollectionsReport({ from: fromValue || undefined, to: toValue || undefined }),
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
        void Promise.all([loadDashboard(), loadTransactions({ from: '', to: '' })]);
    }, []);

    const projectSummaryMap = useMemo(() => {
        const map = new Map<string, { projectId: string; outstanding: number; collected: number; expenses: number; billed: number; netCashFlow: number; projectName: string; contractValue: number }>();
        const rows = dashboard?.projectSummaries ?? [];
        for (const row of rows) {
            map.set(row.projectId, {
                projectId: row.projectId,
                outstanding: Number(row.outstanding ?? 0),
                collected: Number(row.collected ?? 0),
                expenses: Number(row.expenses ?? 0),
                billed: Number(row.billed ?? 0),
                netCashFlow: Number(row.netCashFlow ?? 0),
                projectName: row.projectName,
                contractValue: Number(row.contractValue ?? 0),
            });
        }
        return map;
    }, [dashboard]);

    const topProjects = useMemo(() => {
        const rows = dashboard?.projectSummaries ?? [];
        return [...rows]
            .sort((a, b) => Number(b.outstanding ?? 0) - Number(a.outstanding ?? 0))
            .slice(0, 6);
    }, [dashboard]);

    const defaulterCustomerIds = useMemo(
        () => new Set(defaulters.filter((row) => Number(row.dueInvoices ?? 0) > 0).map((row) => row.customerId)),
        [defaulters],
    );

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

    const topDefaulters = useMemo(
        () => [...defaulters].sort((a, b) => Number(b.outstanding ?? 0) - Number(a.outstanding ?? 0)).slice(0, 4),
        [defaulters],
    );

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

        const companyCollectionTransactions = companyOnlyReceipts.map((row) => ({
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
        }));

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

        const investmentTransactions = investorContributionRows.map((row) => ({
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
    }, [collectionRows, companyOnlyReceipts, expenseRows, investorContributionRows, projectById]);

    const handleApplyFilters = () => {
        void loadTransactions();
    };

    const handleResetFilters = () => {
        setFrom('');
        setTo('');
        void loadTransactions({ from: '', to: '' });
    };

    const money = (value: number | undefined) => (loadingDashboard ? null : dashboard ? formatINR(value ?? 0) : '—');
    const count = (value: number | undefined) => (loadingDashboard ? null : dashboard ? String(value ?? 0) : '—');

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

    useEffect(() => {
        let cancelled = false;

        const loadProjectMetrics = async () => {
            if (projects.length === 0) {
                setProjectMetrics({});
                return;
            }

            const metrics = await Promise.all(
                projects.map(async (project) => {
                    const summary = await getProjectFinancials(project.id);
                    const base = {
                        contractValue: Number(project.contractAmount ?? 0),
                        projectBudget: Number(project.budgetAmount ?? 0),
                        actualCost: 0,
                        customerCollections: 0,
                        investorContributions: 0,
                        expectedProjectMargin: project.budgetAmount ? Number(project.contractAmount ?? 0) - Number(project.budgetAmount ?? 0) : null,
                        cashBasedProfitLoss: 0,
                        budgetRemaining: Number(project.budgetAmount ?? 0),
                        budgetUtilization: 0,
                        netCashFlow: 0,
                    };

                    const next = summary ?? base;
                    return [project.id, {
                        contractValue: Number(next.contractValue ?? project.contractAmount ?? 0),
                        projectBudget: Number(next.projectBudget ?? project.budgetAmount ?? 0),
                        actualCost: Number(next.actualCost ?? 0),
                        customerCollections: Number(next.customerCollections ?? 0),
                        investorContributions: Number(next.investorContributions ?? 0),
                        expectedProjectMargin: next.expectedProjectMargin == null ? (project.budgetAmount ? Number(project.contractAmount ?? 0) - Number(project.budgetAmount ?? 0) : null) : Number(next.expectedProjectMargin),
                        cashBasedProfitLoss: Number(next.cashBasedProfitLoss ?? 0),
                        budgetRemaining: Number(next.budgetRemaining ?? (project.budgetAmount ?? 0)),
                        budgetUtilization: Number(next.budgetUtilization ?? 0),
                        netCashFlow: Number(next.netCashFlow ?? 0),
                    }] as const;
                }),
            );

            if (!cancelled) {
                setProjectMetrics(Object.fromEntries(metrics));
            }
        };

        void loadProjectMetrics();
        return () => { cancelled = true; };
    }, [projects]);

    const kpiCards = useMemo(() => {
        if (!dashboard) {
            return [
                { label: 'Active Projects', value: 'N/A', sub: 'Projects currently in progress', accent: 'bg-[var(--primary-soft)] text-[var(--primary)]', tooltip: 'Projects with an in-progress status.' },
                { label: 'Total Billed', value: 'N/A', sub: 'Actual valid invoices issued', accent: 'bg-[var(--primary-soft)] text-[var(--primary)]', tooltip: 'Sum of non-voided invoice totals after excluding cancelled invoices.' },
                { label: 'Collected', value: 'N/A', sub: 'Actual customer payments received', accent: 'bg-[var(--primary-soft)] text-[var(--primary)]', tooltip: 'Customer receipts only; excludes investor contributions and voided receipts.' },
                { label: 'Outstanding', value: 'N/A', sub: 'Unpaid customer balances after allocations', accent: 'bg-[var(--primary-soft)] text-[var(--primary)]', tooltip: 'Open invoice value after valid payment allocations, excluding cancelled invoices.' },
                { label: 'Actual Expenses', value: 'N/A', sub: 'Recorded project expenses', accent: 'bg-[var(--primary-soft)] text-[var(--primary)]', tooltip: 'Expense bills excluding voided entries; does not include unpaid supplier bills as cash outflows.' },
                { label: 'Net Cash Flow', value: 'N/A', sub: 'Collections minus actual expenses', accent: 'bg-[var(--primary-soft)] text-[var(--primary)]', tooltip: 'Actual customer cash received minus actual expense cash paid; investor funding is tracked separately.' },
            ];
        }

        // Count in-progress projects from the project list so this card agrees with the
        // "Active" filter and the Planned count in the snapshot. Fall back to the report value.
        const inProgressCount = projects.filter((project) => project.status === 'in_progress').length;
        const activeProjectsValue = projects.length > 0
            ? String(inProgressCount)
            : dashboard.activeProjects == null ? 'N/A' : String(dashboard.activeProjects);

        return [
            {
                label: 'Active Projects',
                value: activeProjectsValue,
                sub: 'Projects currently in progress',
                accent: 'bg-[var(--primary-soft)] text-[var(--primary)]',
                tooltip: 'Projects with an in-progress status. Planned projects are counted separately in the snapshot.',
            },
            {
                label: 'Total Billed',
                value: formatCurrencyValue(dashboard.totalBilled),
                sub: 'Actual valid invoices issued',
                accent: 'bg-[var(--primary-soft)] text-[var(--primary)]',
                tooltip: 'Sum of all non-cancelled invoice totals; excludes voided records and projected values.',
            },
            {
                label: 'Collected',
                value: formatCurrencyValue(dashboard.totalCollected),
                sub: 'Actual customer payments received',
                accent: 'bg-[var(--primary-soft)] text-[var(--primary)]',
                tooltip: 'Customer collections only; investor contributions are kept separate and are not included here.',
            },
            {
                label: 'Outstanding',
                value: formatCurrencyValue(dashboard.totalOutstanding),
                sub: 'Unpaid invoice balances after allocations',
                accent: 'bg-[var(--primary-soft)] text-[var(--primary)]',
                tooltip: 'Open invoice balance after valid payment allocations; excludes cancelled invoices and projected values.',
            },
            {
                label: 'Actual Expenses',
                value: formatCurrencyValue(dashboard.totalExpenses),
                sub: 'Recorded project expenses',
                accent: 'bg-[var(--primary-soft)] text-[var(--primary)]',
                tooltip: 'Expense bills excluding voided entries. Unpaid supplier bills are not treated as cash outflows here.',
            },
            {
                label: 'Net Cash Flow',
                value: formatCurrencyValue(dashboard.netCashFlow),
                sub: 'Collections minus actual expenses',
                accent: 'bg-[var(--primary-soft)] text-[var(--primary)]',
                tooltip: 'Actual cash received from customers minus actual cash paid for approved expense bills.',
            },
        ];
    }, [dashboard, projects]);

    const projectFinancialRows = useMemo(() => projects.map((project) => {
        const summary = projectMetrics[project.id] ?? {
            contractValue: Number(project.contractAmount ?? 0),
            projectBudget: Number(project.budgetAmount ?? 0),
            actualCost: 0,
            customerCollections: 0,
            investorContributions: 0,
            expectedProjectMargin: 0,
            cashBasedProfitLoss: 0,
            budgetRemaining: Number(project.budgetAmount ?? 0),
            budgetUtilization: 0,
            netCashFlow: 0,
        };

        const projectSummary = projectSummaryMap.get(project.id);
        const projectValue = getProjectValueMeta(project);
        const actualExpenses = Number(projectSummary?.expenses ?? summary.actualCost ?? 0);
        const customerCollections = Number(projectSummary?.collected ?? summary.customerCollections ?? 0);
        const customerOutstanding = Number(projectSummary?.outstanding ?? 0);

        return {
            id: project.id,
            name: project.name,
            type: project.projectTypeSnapshot || 'General',
            status: project.status,
            businessModel: project.businessModel,
            projectValueLabel: projectValue.label,
            projectValue: projectValue.value,
            projectBudget: Number(summary.projectBudget ?? project.budgetAmount ?? 0),
            actualExpenses,
            customerCollections,
            customerOutstanding,
            netCashFlow: Number(projectSummary?.netCashFlow ?? summary.netCashFlow ?? 0),
            budgetRemaining: Number(summary.budgetRemaining ?? (project.budgetAmount ?? 0)),
            startDate: project.startDate,
            expectedEndDate: project.expectedEndDate,
            updatedAt: project.updatedAt,
            createdAt: project.createdAt,
        };
    }), [defaulterCustomerIds, getProjectValueMeta, projectMetrics, projectSummaryMap, projects]);

    const maxMonthlyValue = monthlyChartData.length > 0
        ? monthlyChartData.reduce((max, entry) => Math.max(max, entry.billed, entry.collected, entry.expenses), 0)
        : 0;

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

    const visibleProjects = useMemo(() => {
        const filtered = projects.filter((project) => {
            if (projectFilter === 'all') return true;
            if (projectFilter === 'active') return project.status === 'in_progress';
            if (projectFilter === 'planned') return project.status === 'planned';
            return project.status === 'completed';
        });

        return [...filtered]
            .map((project) => {
                const summary = projectMetrics[project.id] ?? {
                    contractValue: Number(project.contractAmount ?? 0),
                    projectBudget: Number(project.budgetAmount ?? 0),
                    actualCost: 0,
                    customerCollections: 0,
                    investorContributions: 0,
                    expectedProjectMargin: 0,
                    cashBasedProfitLoss: 0,
                    budgetRemaining: Number(project.budgetAmount ?? 0),
                    budgetUtilization: 0,
                    netCashFlow: 0,
                };
                const projectSummary = projectSummaryMap.get(project.id);
                const projectValue = getProjectValueMeta(project);
                const customerCollections = Number(projectSummary?.collected ?? summary.customerCollections ?? 0);
                const customerOutstanding = Number(projectSummary?.outstanding ?? 0);
                const budgetValue = Number(summary.projectBudget ?? project.budgetAmount ?? 0);
                const actualCost = Number(projectSummary?.expenses ?? summary.actualCost ?? 0);
                const isOverdue = Boolean(project.customerId && defaulterCustomerIds.has(project.customerId) && customerOutstanding > 0);
                const isOverBudget = budgetValue > 0 && actualCost > budgetValue;
                const recentUpdate = project.updatedAt ? new Date(project.updatedAt).getTime() : 0;
                const createdAt = project.createdAt ? new Date(project.createdAt).getTime() : 0;

                return {
                    ...project,
                    projectValue,
                    customerCollections,
                    customerOutstanding,
                    budgetValue,
                    actualCost,
                    isOverdue,
                    priority: isOverdue ? 0 : isOverBudget ? 1 : recentUpdate > 0 ? 2 : 3,
                    recency: recentUpdate || createdAt || 0,
                };
            })
            .sort((a, b) => {
                const priorityDiff = a.priority - b.priority;
                if (priorityDiff !== 0) return priorityDiff;
                return (b.recency || 0) - (a.recency || 0);
            })
            .slice(0, 5);
    }, [defaulterCustomerIds, getProjectValueMeta, projectFilter, projectMetrics, projectSummaryMap, projects]);

    const overdueCustomerCount = defaulters.filter((row) => Number(row.dueInvoices ?? 0) > 0).length;

    const operationalSnapshot = [
        { label: 'Total Projects', value: dashboard ? String(dashboard.projectsCount ?? projects.length) : 'N/A' },
        { label: 'Completed Projects', value: dashboard ? String(projects.filter((p) => p.status === 'completed').length) : 'N/A' },
        { label: 'Planned Projects', value: dashboard ? String(projects.filter((p) => p.status === 'planned').length) : 'N/A' },
        { label: 'Projects At Risk', value: dashboard ? String(overdueCustomerCount) : 'N/A' },
        { label: 'Supplier Outstanding', value: dashboard && dashboard.supplierOutstanding !== null && dashboard.supplierOutstanding !== undefined ? formatCurrencyValue(dashboard.supplierOutstanding) : 'N/A' },
    ];


    type ProjectFinancialRow = (typeof projectFinancialRows)[number];
    const moneyCell = (value: number | null | undefined) => <span className="tabular-nums text-[var(--text)]">{formatCurrencyValue(value)}</span>;
    const projectColumns: Column<ProjectFinancialRow>[] = [
        {
            key: 'project',
            header: 'Project',
            sortValue: (p) => p.name,
            cell: (p) => <CellStack title={p.name} subtitle={p.type || 'Project'} />,
        },
        {
            key: 'status',
            header: 'Status',
            sortValue: (p) => formatStatus(p.status),
            cell: (p) => (
                <StatusPill
                    label={formatStatus(p.status)}
                    tone={p.status === 'completed' ? 'success' : p.status === 'on_hold' || p.status === 'cancelled' ? 'warning' : 'info'}
                />
            ),
        },
        { key: 'value', header: 'Value', align: 'right', sortValue: (p) => p.projectValue, cell: (p) => moneyCell(p.projectValue) },
        { key: 'budget', header: 'Budget', align: 'right', sortValue: (p) => p.projectBudget, cell: (p) => moneyCell(p.projectBudget) },
        { key: 'expenses', header: 'Expenses', align: 'right', sortValue: (p) => p.actualExpenses, cell: (p) => moneyCell(p.actualExpenses) },
        { key: 'collected', header: 'Collected', align: 'right', sortValue: (p) => p.customerCollections, cell: (p) => moneyCell(p.customerCollections) },
        { key: 'outstanding', header: 'Outstanding', align: 'right', sortValue: (p) => p.customerOutstanding, cell: (p) => moneyCell(p.customerOutstanding) },
    ];

    return (
        <div className="space-y-5 lg:space-y-7">
            <PageHeader
                compact
                title="Dashboard"
                description={
                    <>
                        Live summary from project, billing, expense, and receipt ledgers.
                        {(loadingDashboard || loadingTransactions) && <span className="ml-2"><InlineLoader label="Refreshing…" /></span>}
                        {syncedAt && !loadingDashboard && (
                            <span className="ml-1.5 whitespace-nowrap text-xs text-[var(--text-muted)]">Last synced {formatDate(syncedAt)}</span>
                        )}
                    </>
                }
                actions={
                    <>
                        <AppButton variant="secondary" onClick={() => void Promise.all([loadDashboard(), loadTransactions()])} loading={loadingDashboard || loadingTransactions} loadingText="Refreshing…">
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </AppButton>
                        <AppButton variant="secondary" onClick={() => navigate('/reports')}>
                            <BarChart3 className="h-4 w-4" />
                            Open reports
                        </AppButton>
                        <AppButton onClick={openCreateProject}>
                            <Plus className="h-4 w-4" />
                            New project
                        </AppButton>
                    </>
                }
            />

            {error && (
                <div role="alert" className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-fg)]">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {kpiCards.map((card) => (
                    <div key={card.label} title={card.tooltip}>
                        <StatCardButton
                            label={card.label}
                            value={card.value}
                            sub={card.sub}
                            icon={kpiIcons[card.label] ?? <IndianRupee className="h-5 w-5 text-[var(--primary)]" />}
                            iconTone={card.accent}
                            onClick={() => navigate('/reports')}
                        />
                    </div>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
                <PremiumCard className="self-start overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--text)]">Project financial summary</h2>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">Business-model-specific value and actual cash movement by project.</p>
                        </div>
                    </div>

                    <DataTable
                        bare
                        dense
                        mobileLayout="scroll"
                        caption="Project financial summary"
                        columns={projectColumns}
                        rows={projectFinancialRows}
                        rowKey={(project) => project.id}
                        onRowClick={(project) => navigate(`/projects/${project.id}`)}
                        empty={{ title: 'No project summary yet', description: 'Project values, expenses and collections will appear here once you add projects.' }}
                    />
                </PremiumCard>

                <div className="space-y-5">
                    <PremiumCard className="min-w-0 self-start p-5">
                        <h2 className="text-base font-semibold text-[var(--text)]">Operational snapshot</h2>
                        <div className="mt-4 space-y-2.5">
                            {operationalSnapshot.map((item) => (
                                <SnapshotRow
                                    key={item.label}
                                    icon={
                                        item.label === 'Total Projects' ? <FolderKanban className="h-4 w-4 text-[var(--primary)]" /> :
                                            item.label === 'Completed Projects' ? <CalendarClock className="h-4 w-4 text-[var(--success)]" /> :
                                                item.label === 'Planned Projects' ? <CalendarClock className="h-4 w-4 text-[var(--primary)]" /> :
                                                    item.label === 'Projects At Risk' ? <WalletCards className="h-4 w-4 text-[var(--warning-fg)]" /> :
                                                        <Wallet className="h-4 w-4 text-[var(--warning-fg)]" />
                                    }
                                    label={item.label}
                                    value={item.value}
                                />
                            ))}
                        </div>
                    </PremiumCard>

                    <PremiumCard className="min-w-0 self-start p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-[var(--text)]">At-risk accounts</h2>
                            {topDefaulters.length > 0 && <StatusPill label={`${topDefaulters.length} flagged`} tone="warning" />}
                        </div>
                        {topDefaulters.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-muted)]">
                                No overdue customer balances are currently showing in the live reports.
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {topDefaulters.map((row) => (
                                    <div key={row.customerId} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-sm font-semibold text-[var(--text)]">{row.customerName}</p>
                                            <StatusPill label={`${row.dueInvoices} due`} tone="warning" />
                                        </div>
                                        <p className="mt-2 text-xs text-[var(--text-muted)]">Outstanding {formatCurrencyValue(Number(row.outstanding ?? 0))} • {row.invoices} invoice(s)</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PremiumCard>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
                <PremiumCard className="overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--text)]">Monthly financial performance</h2>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">Latest six months of billed, collected and expense activity.</p>
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
                        <div className="p-5 text-sm text-[var(--text-muted)]">No monthly financial data is available yet.</div>
                    ) : (
                        <div className="p-5">
                            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-1)]" />Billed</span>
                                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-2)]" />Collected</span>
                                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-3)]" />Expenses</span>
                            </div>
                            {maxMonthlyValue === 0 && (
                                <p className="mb-3 text-xs text-[var(--text-muted)]">No billing, collections or expenses recorded in the last six months.</p>
                            )}
                            <div className="flex h-48 items-end gap-3">
                                {monthlyChartData.map((entry) => {
                                    const billedHeight = maxMonthlyValue > 0 ? (entry.billed / maxMonthlyValue) * 100 : 0;
                                    const collectedHeight = maxMonthlyValue > 0 ? (entry.collected / maxMonthlyValue) * 100 : 0;
                                    const expenseHeight = maxMonthlyValue > 0 ? (entry.expenses / maxMonthlyValue) * 100 : 0;
                                    return (
                                        <div key={`${entry.month}-chart`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                                            <div className="flex h-36 w-full items-end justify-center gap-1 border-b border-[var(--border)]" aria-label={`${chartMonthLabel(entry.month)} billed ${formatINR(entry.billed)}, collected ${formatINR(entry.collected)}, expenses ${formatINR(entry.expenses)}`}>
                                                <span className="block w-1/3 rounded-t-md bg-[var(--chart-1)] opacity-85" style={{ height: `${billedHeight}%` }} title={`Billed ${formatINR(entry.billed)}`} />
                                                <span className="block w-1/3 rounded-t-md bg-[var(--chart-2)] opacity-85" style={{ height: `${collectedHeight}%` }} title={`Collected ${formatINR(entry.collected)}`} />
                                                <span className="block w-1/3 rounded-t-md bg-[var(--chart-3)] opacity-85" style={{ height: `${expenseHeight}%` }} title={`Expenses ${formatINR(entry.expenses)}`} />
                                            </div>
                                            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{chartMonthLabel(entry.month)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </PremiumCard>

                <PremiumCard className="min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--text)]">Projects</h2>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">Prioritized by overdue balances, overrun risk, and recent activity.</p>
                        </div>
                        <button type="button" onClick={() => navigate('/projects')} className="shrink-0 rounded-md text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                            View all
                        </button>
                    </div>

                    <div className="border-b border-[var(--border)] px-5 py-3">
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
                                <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                                    <div className="space-y-2">
                                        <SkeletonRow className="h-4 w-40" />
                                        <SkeletonRow className="h-3 w-28" />
                                    </div>
                                    <SkeletonRow className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : visibleProjects.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={<FolderKanban className="h-6 w-6" />}
                                title="No matching projects"
                                description="There are no active projects in this filter right now."
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
                            {visibleProjects.map((project, index) => (
                                <li key={project.id}>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-secondary)]" aria-hidden="true">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-semibold text-[var(--text)]">{project.name}</p>
                                                {project.isOverdue && <StatusPill label="Overdue" tone="warning" />}
                                                {project.actualCost > project.budgetValue && project.budgetValue > 0 && <StatusPill label="Over budget" tone="warning" />}
                                            </div>
                                            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                                {project.projectTypeSnapshot || 'General'} • {project.businessModel ? BUSINESS_MODEL_FORM_CONFIG[project.businessModel].contractValueLabel : 'Project value'}
                                            </p>
                                        </div>
                                        <div className="hidden shrink-0 text-right sm:block">
                                            <p className="text-sm font-semibold tabular-nums text-[var(--text)]">{project.projectValue?.value != null ? formatCurrencyValue(project.projectValue.value) : 'N/A'}</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {project.customerOutstanding > 0
                                                    ? `${formatCurrencyValue(project.customerOutstanding)} outstanding`
                                                    : project.customerCollections > 0
                                                        ? 'Collections up to date'
                                                        : 'No billing yet'}
                                            </p>
                                        </div>
                                        <ChevronRight className="hidden h-4 w-4 shrink-0 text-[var(--text-subtle)] sm:block" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                </PremiumCard>
            </div>

            <PremiumCard className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-[var(--text)]">Recent transactions</h2>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">Cash movements from receipts, expenses and investor contributions.</p>
                    </div>
                    <button type="button" onClick={() => navigate('/reports')} className="shrink-0 rounded-md text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                        View all
                    </button>
                </div>

                {transactionError && (
                    <div role="alert" className="border-b border-[var(--danger-border)] bg-[var(--danger-soft)] px-5 py-3 text-sm text-[var(--danger-fg)]">{transactionError}</div>
                )}

                {loadingTransactions ? (
                    <div className="divide-y divide-[var(--border)] px-5 py-2" aria-busy="true" aria-label="Loading transactions">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between gap-4 py-3">
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
                                    className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-[var(--text)]">{row.reference}</p>
                                            <StatusPill
                                                label={row.kind === 'collection' ? 'Collection' : row.kind === 'investment' ? 'Investment' : 'Expense'}
                                                tone={row.kind === 'collection' ? 'success' : 'info'}
                                            />
                                            {row.isCompanyLevel && <StatusPill label="Company-level" tone="neutral" />}
                                            {dateValue(row.occurredOn) > Date.now() && <StatusPill label="Future date" tone="warning" />}
                                        </div>
                                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
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
