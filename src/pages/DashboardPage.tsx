import { AppButton, EmptyState, PageHeader, PremiumCard, SkeletonRow, StatCardButton, StatusPill } from '@/components/ui/DesignSystem';
import { formatDate, formatINR } from '@/lib/utils';
import { listProjects, type ProjectRecord } from '@/services/project.service';
import { getDashboardReport, type DashboardReport } from '@/services/report.service';
import { BarChart3, CalendarClock, ChevronRight, FileText, FolderKanban, IndianRupee, Plus, TrendingUp, Wallet, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const statusTone: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
    planned: 'neutral',
    in_progress: 'info',
    on_hold: 'warning',
    completed: 'success',
};

const formatStatus = (status: string) => {
    const label = status.replace(/_/g, ' ');
    return label.charAt(0).toUpperCase() + label.slice(1);
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<DashboardReport | null>(null);
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncedAt, setSyncedAt] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            const [dashboardData, projectRows] = await Promise.all([getDashboardReport(), listProjects()]);
            if (!active) return;

            if (!dashboardData) {
                setError('Unable to load dashboard data right now.');
            }
            setDashboard(dashboardData);
            setProjects(projectRows);
            setSyncedAt(new Date().toISOString());
            setLoading(false);
        };

        void load();
        return () => { active = false; };
    }, []);

    const topProjects = useMemo(() => {
        return [...projects].sort((a, b) => Number(b.contractAmount ?? 0) - Number(a.contractAmount ?? 0)).slice(0, 5);
    }, [projects]);

    // null = loading skeleton; 'â€”' when the report failed to load (avoids a misleading zero).
    const money = (value: number | undefined) => (loading ? null : dashboard ? formatINR(value ?? 0) : 'â€”');
    const count = (value: number | undefined) => (loading ? null : dashboard ? String(value ?? 0) : 'â€”');

    const openCreateProject = () => navigate('/projects', { state: { openCreate: true } });

    return (
        <div className="space-y-5 lg:space-y-6">
            <PageHeader
                compact
                title="Dashboard"
                description={
                    <>
                        Live summary from project, expense, and receipt ledgers.
                        {syncedAt && !loading && (
                            <span className="ml-1.5 whitespace-nowrap text-xs text-[#667085]">Last synced {formatDate(syncedAt)}</span>
                        )}
                    </>
                }
                actions={
                    <>
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
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCardButton
                    label="Projects"
                    value={count(dashboard?.projectsCount)}
                    sub="Tracked in current company"
                    icon={<FolderKanban className="h-5 w-5 text-[#1D4ED8]" />}
                    iconTone="bg-[#EAF1FF] text-[#1D4ED8]"
                    onClick={() => navigate('/projects')}
                />
                <StatCardButton
                    label="Contract value"
                    value={money(dashboard?.totalContract)}
                    sub="Across all projects"
                    icon={<IndianRupee className="h-5 w-5 text-[#1D4ED8]" />}
                    iconTone="bg-[#EAF1FF] text-[#1D4ED8]"
                    onClick={() => navigate('/projects')}
                />
                <StatCardButton
                    label="Payments received"
                    value={money(dashboard?.totalCollections)}
                    sub="Customer payments received"
                    icon={<TrendingUp className="h-5 w-5 text-[#0F766E]" />}
                    iconTone="bg-[#ECFDF5] text-[#0F766E]"
                    onClick={() => navigate('/client-receipts')}
                />
                <StatCardButton
                    label="Supplier outstanding"
                    value={money(dashboard?.supplierOutstanding)}
                    sub="Unpaid supplier balance"
                    icon={<WalletCards className="h-5 w-5 text-amber-600" />}
                    iconTone="bg-amber-50 text-amber-700"
                    onClick={() => navigate('/expenses')}
                />
            </div>

            <div className="grid gap-5 lg:gap-6 xl:grid-cols-[1.4fr_1fr]">
                <PremiumCard className="min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-[#E6E8EC] px-5 py-4">
                        <h2 className="text-base font-semibold text-[#17243A]">Top projects by contract value</h2>
                        {topProjects.length > 0 && (
                            <button
                                type="button"
                                onClick={() => navigate('/projects')}
                                className="shrink-0 rounded-md text-sm font-medium text-[#1D4ED8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40"
                            >
                                View all
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="divide-y divide-[#E6E8EC]" aria-busy="true" aria-label="Loading projects">
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
                    ) : topProjects.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={<FolderKanban className="h-6 w-6" />}
                                title="No projects yet"
                                description="Create a project to start tracking contract value, costs, and collections. Quotations can be converted into projects once accepted."
                                action={
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        <AppButton onClick={openCreateProject}>
                                            <Plus className="h-4 w-4" />
                                            Create project
                                        </AppButton>
                                        <AppButton variant="secondary" onClick={() => navigate('/quotations/new')}>
                                            <FileText className="h-4 w-4" />
                                            Create quotation
                                        </AppButton>
                                    </div>
                                }
                            />
                        </div>
                    ) : (
                        <ol className="divide-y divide-[#E6E8EC]">
                            {topProjects.map((project, index) => (
                                <li key={project.id}>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D4ED8]/40"
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-[#344054]" aria-hidden="true">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#17243A]">{project.name}</p>
                                            <p className="mt-0.5 truncate text-xs text-[#667085]">{project.projectNumber} â€¢ {project.customer?.name || 'Customer pending'}</p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <p className="text-sm font-semibold tabular-nums text-[#17243A]">{formatINR(project.contractAmount)}</p>
                                            <StatusPill label={formatStatus(project.status)} tone={statusTone[project.status] ?? 'neutral'} />
                                        </div>
                                        <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                </PremiumCard>

                <PremiumCard className="min-w-0 self-start p-5">
                    <h2 className="text-base font-semibold text-[#17243A]">Operational snapshot</h2>
                    <div className="mt-4 space-y-2.5">
                        <SnapshotRow icon={<CalendarClock className="h-4 w-4 text-[#1D4ED8]" />} label="Active projects" value={count(dashboard?.activeProjects)} />
                        <SnapshotRow icon={<IndianRupee className="h-4 w-4 text-[#0F766E]" />} label="Total supplier cost" value={money(dashboard?.totalCost)} />
                        <SnapshotRow
                            icon={<Wallet className="h-4 w-4 text-amber-600" />}
                            label="Net cash position"
                            value={loading ? null : dashboard ? formatINR((dashboard.totalCollections ?? 0) - (dashboard.totalCost ?? 0)) : 'â€”'}
                        />
                    </div>
                    <p className="mt-3 text-xs text-[#667085]">Net cash position = collections received minus total supplier cost.</p>
                </PremiumCard>
            </div>
        </div>
    );
}

function SnapshotRow({ icon, label, value }: { icon: ReactNode; label: string; value: string | null }) {
    return (
        <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-[#E6E8EC] bg-slate-50 px-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-[#344054]">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
                <span className="truncate">{label}</span>
            </div>
            {value === null ? (
                <SkeletonRow className="h-4 w-16" />
            ) : (
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[#17243A]">{value}</span>
            )}
        </div>
    );
}

