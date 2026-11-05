import { AppButton, PremiumCard, StatusPill } from '@/components/ui/DesignSystem';
import { useToast } from '@/context/ToastContext';
import { listParties, type PartyRecord } from '@/services/party.service';
import { listProjects, type ProjectRecord } from '@/services/project.service';
import {
    createProjectClientAccessResult,
    createProjectInvestorResult,
    deleteProjectInvestorResult,
    listProjectClientAccess,
    listProjectInvestors,
    revokeProjectClientAccessResult,
    type ProjectClientAccessRecord,
    type ProjectInvestorRecord,
} from '@/services/projectCost.service';
import { ShieldCheck, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]';

export default function AccessManagementPage() {
    const { push } = useToast();
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [customerContacts, setCustomerContacts] = useState<PartyRecord[]>([]);
    const [investorContacts, setInvestorContacts] = useState<PartyRecord[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [accessType, setAccessType] = useState<'customer' | 'investor'>('customer');
    const [selectedPartyId, setSelectedPartyId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingAccess, setLoadingAccess] = useState(false);
    const [customerAccessRows, setCustomerAccessRows] = useState<ProjectClientAccessRecord[]>([]);
    const [investorAccessRows, setInvestorAccessRows] = useState<ProjectInvestorRecord[]>([]);

    const availableContacts = useMemo(
        () => (accessType === 'customer' ? customerContacts : investorContacts),
        [accessType, customerContacts, investorContacts],
    );

    const loadProjects = async () => {
        setLoadingProjects(true);
        const rows = await listProjects();
        setProjects(rows);
        if (!selectedProjectId && rows[0]?.id) {
            setSelectedProjectId(rows[0].id);
        }
        setLoadingProjects(false);
    };

    const loadParties = async () => {
        const [customers, investors] = await Promise.all([
            listParties(undefined, 'customer', '', { activeOnly: true }),
            listParties(undefined, 'investor', '', { activeOnly: true }),
        ]);

        setCustomerContacts(customers.filter((party) => party.isCustomer && party.isActive));
        setInvestorContacts(investors.filter((party) => party.isInvestor && party.isActive));
    };

    const loadProjectAccess = async (projectId: string) => {
        if (!projectId) {
            setCustomerAccessRows([]);
            setInvestorAccessRows([]);
            return;
        }

        setLoadingAccess(true);
        const [customerRows, investorRows] = await Promise.all([
            listProjectClientAccess(projectId),
            listProjectInvestors(projectId),
        ]);
        setCustomerAccessRows(customerRows);
        setInvestorAccessRows(investorRows.filter((row) => row.isActive));
        setLoadingAccess(false);
    };

    useEffect(() => {
        void loadProjects();
        void loadParties();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) return;
        void loadProjectAccess(selectedProjectId);
    }, [selectedProjectId]);

    useEffect(() => {
        setSelectedPartyId('');
        setName('');
        setEmail('');
    }, [selectedProjectId, accessType]);

    const handleContactSelect = (partyId: string) => {
        const target = availableContacts.find((party) => party.id === partyId);
        setSelectedPartyId(partyId);
        setName(target?.name ?? '');
        setEmail(target?.email ?? '');
    };

    const handleCreateAccess = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedProjectId) {
            push('error', 'Select a project before granting access.');
            return;
        }

        if (accessType === 'customer') {
            const trimmedEmail = email.trim().toLowerCase();
            if (!trimmedEmail) {
                push('error', 'Customer email is required.');
                return;
            }

            setSaving(true);
            const created = await createProjectClientAccessResult({ projectId: selectedProjectId, email: trimmedEmail });
            setSaving(false);

            if (!created.ok) {
                if (created.status === 404) {
                    push('error', 'No user account exists for that client. Invite or create the account first, then grant project access.');
                } else {
                    push('error', created.error || 'Could not grant customer access right now. Please try again.');
                }
                return;
            }

            push('success', 'Customer access granted successfully. The customer can now view shared project updates.');
            setSelectedPartyId('');
            setName('');
            setEmail('');
            await loadProjectAccess(selectedProjectId);
            return;
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedName || !trimmedEmail) {
            push('error', 'Investor name and email are required.');
            return;
        }

        setSaving(true);
        const created = await createProjectInvestorResult({
            projectId: selectedProjectId,
            userId: null,
            name: trimmedName,
            email: trimmedEmail,
            phone: null,
            investmentPercentage: null,
            canViewFinancials: true,
            canApprovePayments: false,
            canViewClientReceipts: true,
            isActive: true,
        });
        setSaving(false);

        if (!created.ok) {
            if (created.status === 404) {
                push('error', 'No user account exists for that investor. Invite or create the account first, then grant project access.');
            } else {
                push('error', created.error || 'Could not grant investor access right now. Please try again.');
            }
            return;
        }

        push('success', 'Investor access granted successfully. The investor can now view shared project updates.');
        setSelectedPartyId('');
        setName('');
        setEmail('');
        await loadProjectAccess(selectedProjectId);
    };

    const handleRevokeCustomer = async (id: string) => {
        const result = await revokeProjectClientAccessResult(id);
        if (!result.ok) {
            push('error', result.error || 'Could not revoke customer access right now. Please try again.');
            return;
        }
        push('success', 'Customer access revoked successfully. This customer can no longer view shared project updates.');
        await loadProjectAccess(selectedProjectId);
    };

    const handleRevokeInvestor = async (id: string) => {
        const result = await deleteProjectInvestorResult(id);
        if (!result.ok) {
            push('error', result.error || 'Could not revoke investor access right now. Please try again.');
            return;
        }
        push('success', 'Investor access revoked successfully. This investor can no longer view shared project updates.');
        await loadProjectAccess(selectedProjectId);
    };

    const selectedProjectName = projects.find((project) => project.id === selectedProjectId)?.name ?? 'Project';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#667085]">Security</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#17243A]">Access management</h1>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#E6E8EC] bg-white px-3 py-2 text-sm text-[#344054]">
                    <ShieldCheck className="h-4 w-4 text-[#1D4ED8]" />
                    Project access control
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
                <PremiumCard className="p-5">
                    <div className="space-y-4">
                        <div>
                            <p className="text-base font-semibold text-[#17243A]">Grant project access</p>
                            <p className="mt-1 text-sm text-[#667085]">Choose the project and pick an existing customer or investor.</p>
                        </div>

                        <form onSubmit={handleCreateAccess} className="space-y-4">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Project</span>
                                <select
                                    className={inputClass}
                                    value={selectedProjectId}
                                    onChange={(event) => setSelectedProjectId(event.target.value)}
                                    disabled={loadingProjects || projects.length === 0}
                                >
                                    <option value="">Select a project</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Access type</span>
                                <select
                                    className={inputClass}
                                    value={accessType}
                                    onChange={(event) => setAccessType(event.target.value as 'customer' | 'investor')}
                                >
                                    <option value="customer">Customer</option>
                                    <option value="investor">Investor</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">Existing {accessType === 'customer' ? 'customer' : 'investor'}</span>
                                <select
                                    className={inputClass}
                                    value={selectedPartyId}
                                    onChange={(event) => handleContactSelect(event.target.value)}
                                    disabled={!selectedProjectId || availableContacts.length === 0}
                                >
                                    <option value="">Select an existing contact</option>
                                    {availableContacts.map((party) => (
                                        <option key={party.id} value={party.id}>{party.name} — {party.email || 'No email'}</option>
                                    ))}
                                </select>
                            </label>

                            {accessType === 'investor' && (
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-[#344054]">Investor name</span>
                                    <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Investor name" />
                                </label>
                            )}

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-[#344054]">{accessType === 'customer' ? 'Customer email' : 'Investor email'}</span>
                                <input type="email" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
                            </label>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                The person must already have an application account with the same email. If not, create or invite them first.
                            </div>

                            <div className="flex justify-end">
                                <AppButton type="submit" disabled={saving || !selectedProjectId}>
                                    {saving ? 'Saving...' : `Grant ${accessType} access`}
                                </AppButton>
                            </div>
                        </form>
                    </div>
                </PremiumCard>

                <div className="space-y-6">
                    <PremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-base font-semibold text-[#17243A]">{selectedProjectName}</p>
                                <p className="mt-1 text-sm text-[#667085]">Current access for this project</p>
                            </div>
                            <div className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
                                {customerAccessRows.length + investorAccessRows.length} active
                            </div>
                        </div>

                        {loadingAccess ? (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Loading access data...</div>
                        ) : (
                            <div className="mt-5 space-y-5">
                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#17243A]">
                                        <Users className="h-4 w-4 text-[#1D4ED8]" />
                                        Customer access
                                    </div>
                                    {customerAccessRows.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-3 text-sm text-[#667085]">No customer access added yet.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {customerAccessRows.map((row) => (
                                                <div key={row.id} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] bg-white px-3 py-2.5">
                                                    <div>
                                                        <p className="text-sm font-medium text-[#17243A]">{row.email}</p>
                                                        <p className="text-xs text-[#667085]">{row.invitationStatus}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusPill label={row.invitationStatus} tone={row.invitationStatus === 'accepted' ? 'success' : row.invitationStatus === 'pending' ? 'info' : 'warning'} />
                                                        <button type="button" onClick={() => handleRevokeCustomer(row.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#17243A]">
                                        <Users className="h-4 w-4 text-[#1D4ED8]" />
                                        Investor access
                                    </div>
                                    {investorAccessRows.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-3 text-sm text-[#667085]">No investor access added yet.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {investorAccessRows.map((row) => (
                                                <div key={row.id} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] bg-white px-3 py-2.5">
                                                    <div>
                                                        <p className="text-sm font-medium text-[#17243A]">{row.name}</p>
                                                        <p className="text-xs text-[#667085]">{row.email || 'No email linked'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusPill label={row.isActive ? 'Active' : 'Revoked'} tone={row.isActive ? 'success' : 'warning'} />
                                                        <button type="button" onClick={() => handleRevokeInvestor(row.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </PremiumCard>
                </div>
            </div>
        </div>
    );
}
