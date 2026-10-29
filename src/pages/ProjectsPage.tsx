import {
    ProjectAttachmentsPanel,
    ProjectClientAccessPanel,
    ProjectExpensePanel,
    ProjectInvestorsPanel,
    ProjectOverviewPanel,
    ProjectProgressPanel,
    ProjectReceiptPanel,
    ProjectStagePanel,
    projectTabs,
} from '@/components/projects/ProjectDetailTabs';
import { AppButton, Modal, PremiumCard, StatusPill, TabList, TablePagination } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatINR } from '@/lib/utils';
import { createProject, getProject, listProjects, type ProjectRecord } from '@/services/project.service';
import { CalendarClock, Eye, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const statusLabelMap: Record<string, string> = {
    planned: 'Planned',
    in_progress: 'In progress',
    on_hold: 'On hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const statusToneMap: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
    planned: 'neutral',
    in_progress: 'info',
    on_hold: 'warning',
    completed: 'success',
    cancelled: 'danger',
};

const formatCurrency = (value: number) => formatINR(Number(value ?? 0));

function getProjectSummary(project: ProjectRecord) {
    return {
        location: project.siteAddress || project.customer?.address || 'Location pending',
        nextMilestone: project.expectedEndDate ? formatDate(project.expectedEndDate) : 'No milestone set',
        progress: project.status === 'completed' ? 100 : project.status === 'in_progress' ? 65 : project.status === 'on_hold' ? 45 : 20,
    };
}

export default function ProjectsPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [savingProject, setSavingProject] = useState(false);
    const [projectForm, setProjectForm] = useState({
        name: '',
        description: '',
        siteAddress: '',
        contractAmount: '',
        startDate: '',
        expectedEndDate: '',
    });
    const pageSize = 10;

    const loadProjects = async () => {
        setLoading(true);
        const rows = await listProjects();
        setProjects(rows);
        setLoading(false);
    };

    useEffect(() => {
        void loadProjects();
    }, []);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
        if (page > totalPages) setPage(totalPages);
    }, [page, projects.length]);

    const pagedProjects = useMemo(() => {
        const start = (page - 1) * pageSize;
        return projects.slice(start, start + pageSize);
    }, [page, projects]);

    const handleCreateProject = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!projectForm.name.trim()) {
            push('error', 'Project name is required.');
            return;
        }

        const amount = projectForm.contractAmount.trim() ? Number(projectForm.contractAmount) : 0;
        if (!Number.isFinite(amount) || amount < 0) {
            push('error', 'Contract value must be 0 or greater.');
            return;
        }

        setSavingProject(true);
        const created = await createProject({
            name: projectForm.name.trim(),
            description: projectForm.description.trim() || null,
            siteAddress: projectForm.siteAddress.trim() || null,
            contractAmount: amount,
            startDate: projectForm.startDate || null,
            expectedEndDate: projectForm.expectedEndDate || null,
            status: 'planned',
        });
        setSavingProject(false);

        if (!created) {
            push('error', 'Could not create project.');
            return;
        }

        push('success', 'Project created.');
        setShowAddModal(false);
        setProjectForm({ name: '', description: '', siteAddress: '', contractAmount: '', startDate: '', expectedEndDate: '' });
        await loadProjects();
        navigate(`/projects/${created.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#667085]">Projects</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#17243A]">Project portfolio</h1>
                </div>
                <AppButton onClick={() => setShowAddModal(true)}>Add project</AppButton>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading projects…</div>
            ) : projects.length === 0 ? (
                <PremiumCard className="p-10 text-center text-sm text-slate-500">No projects available yet.</PremiumCard>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-[#E6E8EC] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                                <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                    <tr>
                                        <th className="px-4 py-3.5 text-left font-semibold text-white">Project</th>
                                        <th className="px-4 py-3.5 text-left font-semibold text-white">Customer</th>
                                        <th className="px-4 py-3.5 text-left font-semibold text-white">Location</th>
                                        <th className="px-4 py-3.5 text-left font-semibold text-white">Next Milestone</th>
                                        <th className="px-4 py-3.5 text-left font-semibold text-white">Value</th>
                                        <th className="px-4 py-3.5 text-left font-semibold text-white">Status</th>
                                        <th className="px-4 py-3.5 text-center font-semibold text-white">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                    {pagedProjects.map((project) => {
                                        const summary = getProjectSummary(project);
                                        return (
                                            <tr key={project.id} className="transition-colors hover:bg-slate-50">
                                                <td className="px-4 py-3.5">
                                                    <p className="font-medium text-[#17243A]">{project.name}</p>
                                                    <p className="text-xs text-[#667085]">{project.projectNumber || 'Project number pending'}</p>
                                                </td>
                                                <td className="px-4 py-3.5 text-[#344054]">{project.customer?.name || 'Pending'}</td>
                                                <td className="px-4 py-3.5 text-[#344054]">{summary.location}</td>
                                                <td className="px-4 py-3.5 text-[#344054]">{summary.nextMilestone}</td>
                                                <td className="px-4 py-3.5 font-medium text-[#17243A]">{formatCurrency(project.contractAmount)}</td>
                                                <td className="px-4 py-3.5"><StatusPill label={statusLabelMap[project.status] ?? project.status} tone={statusToneMap[project.status] ?? 'neutral'} /></td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <AppButton
                                                        variant="secondary"
                                                        className="!px-2.5 !py-1.5"
                                                        onClick={() => navigate(`/projects/${project.id}`)}
                                                        aria-label={`View ${project.name}`}
                                                        title="View project"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </AppButton>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <TablePagination page={page} pageSize={pageSize} total={projects.length} onPageChange={setPage} />
                </div>
            )}

            {showAddModal && (
                <Modal eyebrow="Project" title="Add project" onClose={() => setShowAddModal(false)} size="xl">
                    <form onSubmit={handleCreateProject} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="block md:col-span-2">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Project name <span className="text-red-600">*</span></span>
                                <input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" value={projectForm.name} onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))} />
                            </label>
                            <label className="block md:col-span-2">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Description</span>
                                <textarea className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" value={projectForm.description} onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))} />
                            </label>
                            <label className="block md:col-span-2">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Site address</span>
                                <input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" value={projectForm.siteAddress} onChange={(event) => setProjectForm((prev) => ({ ...prev, siteAddress: event.target.value }))} />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Contract value</span>
                                <input type="number" min="0" step="0.01" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" value={projectForm.contractAmount} onChange={(event) => setProjectForm((prev) => ({ ...prev, contractAmount: event.target.value }))} />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Start date</span>
                                <input type="date" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" value={projectForm.startDate} onChange={(event) => setProjectForm((prev) => ({ ...prev, startDate: event.target.value }))} />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Expected end date</span>
                                <input type="date" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]" value={projectForm.expectedEndDate} onChange={(event) => setProjectForm((prev) => ({ ...prev, expectedEndDate: event.target.value }))} />
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={savingProject}>{savingProject ? 'Saving...' : 'Create project'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export function ProjectDetailPage() {
    const { id } = useParams();
    const { company } = useCompany();
    const [project, setProject] = useState<ProjectRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('Overview');

    useEffect(() => {
        if (!id) {
            setProject(null);
            setLoading(false);
            return;
        }

        let active = true;
        void (async () => {
            const result = await getProject(id);
            if (!active) return;
            setProject(result);
            setLoading(false);
        })();

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading project…</div>;
    }

    if (!project) {
        return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Project not found.</div>;
    }

    const summary = getProjectSummary(project);
    const customerMobile = project.customer?.mobile ?? null;
    const canManage = company?.callerRole === 'owner' || company?.callerRole === 'admin';

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-[#E6E8EC] bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.04)] sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#667085]">Project</p>
                        <div className="mt-2 flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-[#17243A]">{project.name}</h1>
                            <StatusPill label={statusLabelMap[project.status] ?? project.status} tone={statusToneMap[project.status] ?? 'neutral'} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#667085]">
                            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {summary.location}</span>
                            <span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {summary.nextMilestone}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <TabList tabs={projectTabs.map((tab) => ({ id: tab, label: tab }))} active={activeTab} onChange={setActiveTab} />
                </div>
            </div>

            {activeTab === 'Overview' && <ProjectOverviewPanel project={project} />}
            {activeTab === 'Stages' && <ProjectStagePanel projectId={project.id} />}
            {activeTab === 'Site Updates' && <ProjectProgressPanel projectId={project.id} />}
            {activeTab === 'Expenses' && <ProjectExpensePanel projectId={project.id} />}
            {activeTab === 'Payments Received' && <ProjectReceiptPanel projectId={project.id} customerMobile={customerMobile} projectName={project.name} />}
            {activeTab === 'Documents' && <ProjectAttachmentsPanel projectId={project.id} canManage={canManage} />}
            {activeTab === 'Customer Access' && <ProjectClientAccessPanel projectId={project.id} />}
            {activeTab === 'Investors' && <ProjectInvestorsPanel projectId={project.id} />}
        </div>
    );
}
