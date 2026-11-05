import { useAuth } from '@/context/AuthContext';
import { formatDate, formatINR } from '@/lib/utils';
import { listExternalProjects, type ExternalProjectSummary } from '@/services/externalDashboard.service';
import { useEffect, useMemo, useState } from 'react';

function formatStatus(status: string | null | undefined) {
    if (!status) return 'Planned';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{label}</div>
            <div className="mt-2 text-base font-semibold text-slate-900">{value}</div>
        </div>
    );
}

export default function ExternalDashboardPage({ mode }: { mode: 'client' | 'investor' }) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<ExternalProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const rows = await listExternalProjects();
                if (!active) return;
                setProjects(rows);
            } catch (err) {
                console.error(err);
                if (!active) return;
                setError('Unable to load your assigned projects right now.');
                setProjects([]);
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    const filteredProjects = useMemo(
        () => projects.filter((project) => (mode === 'client' ? project.totalContractValue !== null : project.myInvestment !== null || project.myFundingHistory.length > 0)),
        [mode, projects],
    );

    if (!user || (user.role !== 'client' && user.role !== 'investor')) {
        return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Access denied.</div>;
    }

    if (loading) {
        return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading your projects…</div>;
    }

    if (error) {
        return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>;
    }

    if (filteredProjects.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
                No assigned projects found for this {mode} account.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm uppercase tracking-[0.12em] text-slate-500">{mode === 'client' ? 'Client portal' : 'Investor portal'}</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">{mode === 'client' ? 'My Projects' : 'My Investments'}</h1>
                </div>
            </div>

            {filteredProjects.map((project) => (
                <div key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">{project.name}</h2>
                            <p className="text-sm text-slate-500">{project.projectTypeSnapshot ?? 'Project'} • {project.siteAddress ?? 'Site location not set'}</p>
                        </div>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                            {formatStatus(project.status)}
                        </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                        {mode === 'client' ? (
                            <>
                                <StatCell label="Total Contract Value" value={formatINR(project.totalContractValue ?? 0)} />
                                <StatCell label="Amount Paid by You" value={formatINR(project.amountPaidByClient ?? 0)} />
                                <StatCell label="Outstanding Amount" value={formatINR(project.outstandingAmount ?? 0)} />
                                <StatCell label="Next Payment / Due Date" value={project.nextPaymentDueDate ? formatDate(project.nextPaymentDueDate) : '—'} />
                            </>
                        ) : (
                            <>
                                <StatCell label="My Investment" value={formatINR(project.myInvestment ?? 0)} />
                                <StatCell label="Funding History" value={`${project.myFundingHistory.length} entries`} />
                                <StatCell label="Project Progress" value={project.progressPercent != null ? `${project.progressPercent}%` : '—'} />
                                <StatCell label="Latest Update" value={project.updates[0]?.createdAt ? formatDate(project.updates[0].createdAt) : '—'} />
                            </>
                        )}
                    </div>

                    <div className="mt-5 grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Project progress</h3>
                            <p className="mt-2 text-sm text-slate-700">{project.progressPercent != null ? `${project.progressPercent}% complete` : 'Progress data not available yet.'}</p>
                            {project.milestones.length > 0 ? (
                                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                    {project.milestones.slice(0, 4).map((milestone) => (
                                        <li key={milestone.id} className="rounded-lg border border-slate-200 px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span>{milestone.name}</span>
                                                <span className="text-xs text-slate-500">{milestone.completionPercent ?? 0}%</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-slate-500">No milestones are available yet.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Timeline</h3>
                            <div className="mt-3 space-y-2 text-sm text-slate-700">
                                <div>Start date: {project.startDate ? formatDate(project.startDate) : '—'}</div>
                                <div>Expected end: {project.expectedEndDate ? formatDate(project.expectedEndDate) : '—'}</div>
                                <div>Actual end: {project.actualEndDate ? formatDate(project.actualEndDate) : '—'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">{mode === 'client' ? 'Payment history' : 'Funding history'}</h3>
                            {(mode === 'client' ? project.paymentHistory : project.myFundingHistory).length > 0 ? (
                                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                    {(mode === 'client' ? project.paymentHistory : project.myFundingHistory).slice(0, 5).map((entry) => (
                                        <li key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                            <span>{entry.reference ?? 'Entry'} • {entry.date ? formatDate(entry.date) : '—'}</span>
                                            <span className="font-medium">{formatINR(entry.amount)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-slate-500">No payment history is available yet.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Updates & documents</h3>
                            <div className="mt-3 space-y-3 text-sm text-slate-700">
                                {project.updates.length > 0 ? (
                                    <div>
                                        <div className="font-medium text-slate-800">Recent updates</div>
                                        {project.updates.slice(0, 2).map((update) => (
                                            <div key={update.id} className="mt-2 rounded-lg border border-slate-200 px-3 py-2">
                                                <div className="font-medium">{update.title}</div>
                                                <div className="text-xs text-slate-500">{update.createdAt ? formatDate(update.createdAt) : '—'}</div>
                                                {update.message ? <div className="mt-1 text-sm text-slate-600">{update.message}</div> : null}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500">No project updates shared yet.</p>
                                )}

                                {project.documents.length > 0 ? (
                                    <div>
                                        <div className="font-medium text-slate-800">Shared documents</div>
                                        <ul className="mt-2 space-y-2">
                                            {project.documents.slice(0, 3).map((document) => (
                                                <li key={document.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                                                    {document.name} <span className="text-slate-400">({document.fileType ?? 'file'})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-slate-500">No shared documents yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
