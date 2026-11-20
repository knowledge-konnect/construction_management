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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            <div className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</div>
            <div className="mt-2 text-base font-semibold text-[var(--text)]">{value}</div>
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
        return <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-6 text-sm text-[var(--danger-fg)]">Access denied.</div>;
    }

    if (loading) {
        return <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-muted)]">Loading your projects…</div>;
    }

    if (error) {
        return <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-6 text-sm text-[var(--danger-fg)]">{error}</div>;
    }

    if (filteredProjects.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] p-8 text-center text-sm text-[var(--text-secondary)]">
                No assigned projects found for this {mode} account.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm uppercase tracking-[0.12em] text-[var(--text-muted)]">{mode === 'client' ? 'Client portal' : 'Investor portal'}</p>
                    <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">{mode === 'client' ? 'My Projects' : 'My Investments'}</h1>
                </div>
            </div>

            {filteredProjects.map((project) => (
                <div key={project.id} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-[var(--text)]">{project.name}</h2>
                            <p className="text-sm text-[var(--text-muted)]">{project.projectTypeSnapshot ?? 'Project'} • {project.siteAddress ?? 'Site location not set'}</p>
                        </div>
                        <span className="inline-flex rounded-full bg-[var(--surface-muted)] px-3 py-1 text-sm font-medium text-[var(--text-secondary)]">
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
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Project progress</h3>
                            <p className="mt-2 text-sm text-[var(--text-secondary)]">{project.progressPercent != null ? `${project.progressPercent}% complete` : 'Progress data not available yet.'}</p>
                            {project.milestones.length > 0 ? (
                                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                                    {project.milestones.slice(0, 4).map((milestone) => (
                                        <li key={milestone.id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span>{milestone.name}</span>
                                                <span className="text-xs text-[var(--text-muted)]">{milestone.completionPercent ?? 0}%</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-[var(--text-muted)]">No milestones are available yet.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Timeline</h3>
                            <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                                <div>Start date: {project.startDate ? formatDate(project.startDate) : '—'}</div>
                                <div>Expected end: {project.expectedEndDate ? formatDate(project.expectedEndDate) : '—'}</div>
                                <div>Actual end: {project.actualEndDate ? formatDate(project.actualEndDate) : '—'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{mode === 'client' ? 'Payment history' : 'Funding history'}</h3>
                            {(mode === 'client' ? project.paymentHistory : project.myFundingHistory).length > 0 ? (
                                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                                    {(mode === 'client' ? project.paymentHistory : project.myFundingHistory).slice(0, 5).map((entry) => (
                                        <li key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2">
                                            <span>{entry.reference ?? 'Entry'} • {entry.date ? formatDate(entry.date) : '—'}</span>
                                            <span className="font-medium">{formatINR(entry.amount)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-[var(--text-muted)]">No payment history is available yet.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Updates & documents</h3>
                            <div className="mt-3 space-y-3 text-sm text-[var(--text-secondary)]">
                                {project.updates.length > 0 ? (
                                    <div>
                                        <div className="font-medium text-[var(--text)]">Recent updates</div>
                                        {project.updates.slice(0, 2).map((update) => (
                                            <div key={update.id} className="mt-2 rounded-lg border border-[var(--border)] px-3 py-2">
                                                <div className="font-medium">{update.title}</div>
                                                <div className="text-xs text-[var(--text-muted)]">{update.createdAt ? formatDate(update.createdAt) : '—'}</div>
                                                {update.message ? <div className="mt-1 text-sm text-[var(--text-secondary)]">{update.message}</div> : null}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[var(--text-muted)]">No project updates shared yet.</p>
                                )}

                                {project.documents.length > 0 ? (
                                    <div>
                                        <div className="font-medium text-[var(--text)]">Shared documents</div>
                                        <ul className="mt-2 space-y-2">
                                            {project.documents.slice(0, 3).map((document) => (
                                                <li key={document.id} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                                                    {document.name} <span className="text-slate-400">({document.fileType ?? 'file'})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-[var(--text-muted)]">No shared documents yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
