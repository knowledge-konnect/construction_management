<<<<<<< HEAD
import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, Modal, PageHeader, TablePagination } from '@/components/ui/DesignSystem';
=======
>>>>>>> origin/main
import { Field, Select, TextInput } from '@/components/ui/Form';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { addTeamMember, listTeamMembers, updateTeamMember, type TeamMember } from '@/services/team.service';
<<<<<<< HEAD
import { Plus, ShieldCheck, User, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const TEAM_TABLE_PAGE_SIZE = 10;

function RoleBadge({ role }: { role: TeamMember['role'] }) {
  const styles: Record<TeamMember['role'], string> = {
    owner: 'bg-[#1D4ED8]/10 text-[#1D4ED8]',
=======
import { Plus, ShieldCheck, User, UserX, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function RoleBadge({ role }: { role: TeamMember['role'] }) {
  const styles: Record<TeamMember['role'], string> = {
    owner: 'bg-[#0B2857]/10 text-[#0B2857]',
>>>>>>> origin/main
    admin: 'bg-blue-50 text-blue-700',
    staff: 'bg-slate-100 text-slate-600',
  };
  return <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[role]}`}>{role}</span>;
}

export default function TeamPage() {
  const { company } = useCompany();
  const { push } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
<<<<<<< HEAD
  const [pendingDeactivate, setPendingDeactivate] = useState<TeamMember | null>(null);
  const [page, setPage] = useState(1);
=======
>>>>>>> origin/main

  const canManage = company?.callerRole === 'owner' || company?.callerRole === 'admin';

  const refresh = async () => {
    if (!company) return;
    setLoading(true);
    setMembers(await listTeamMembers(company.companyId));
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [company?.companyId]);

<<<<<<< HEAD
  const pagedMembers = useMemo(() => {
    const start = (page - 1) * TEAM_TABLE_PAGE_SIZE;
    return members.slice(start, start + TEAM_TABLE_PAGE_SIZE);
  }, [members, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(members.length / TEAM_TABLE_PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [members.length, page]);

=======
>>>>>>> origin/main
  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setRole('staff');
    setShowAddForm(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (password && password.length < 8) {
      push('error', 'Password must be at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    const result = await addTeamMember(company.companyId, {
      email: email.trim(),
      fullName: fullName.trim() || undefined,
      password: password || undefined,
      role,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      push('error', result.error || 'Could not add team member.');
      return;
    }
    push('success', result.isNewAccount
      ? 'Account created. Share the password with them directly — they\u2019ll be asked to change it on first login.'
      : 'Existing account added to your company.');
    resetForm();
    void refresh();
  };

  const handleToggleActive = async (member: TeamMember) => {
    if (!company) return;
<<<<<<< HEAD
    if (member.isActive) {
      setPendingDeactivate(member);
      return;
    }
    const result = await updateTeamMember(company.companyId, member.userId, { isActive: true });
=======
    const result = await updateTeamMember(company.companyId, member.userId, { isActive: !member.isActive });
>>>>>>> origin/main
    if (!result.ok) {
      push('error', result.error || 'Could not update team member.');
      return;
    }
<<<<<<< HEAD
    push('success', 'Team member reactivated.');
    void refresh();
  };

  const confirmDeactivate = async () => {
    if (!company || !pendingDeactivate) return;
    const member = pendingDeactivate;
    setPendingDeactivate(null);
    const result = await updateTeamMember(company.companyId, member.userId, { isActive: false });
    if (!result.ok) {
      push('error', result.error || 'Could not update team member.');
      return;
    }
    push('success', 'Team member deactivated.');
=======
    push('success', member.isActive ? 'Team member deactivated.' : 'Team member reactivated.');
>>>>>>> origin/main
    void refresh();
  };

  const handleRoleChange = async (member: TeamMember, newRole: 'admin' | 'staff') => {
    if (!company) return;
    const result = await updateTeamMember(company.companyId, member.userId, { role: newRole });
    if (!result.ok) {
      push('error', result.error || 'Could not update role.');
      return;
    }
    push('success', 'Role updated.');
    void refresh();
  };

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage access, permissions, and active user status across your company workspace."
        actions={canManage && !showAddForm ? (
          <AppButton onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Add Team Member
          </AppButton>
        ) : undefined}
      />

      {showAddForm && (
        <Modal eyebrow="Team" title="Add team member" onClose={resetForm} size="lg">
          <form onSubmit={handleAdd} className="space-y-5">
            <p className="text-xs text-slate-500">
              If this email already has an account, they’ll simply be added to your company — their existing
              password stays unchanged. Otherwise a new account is created with the password you set below, and
              they’ll be asked to change it the first time they log in.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Email" required>
                <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" required />
              </Field>
              <Field label="Full Name">
                <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Password" required>
                <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
              </Field>
              <Field label="Role" required>
                <Select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}>
                  <option value="staff">Staff — quotations &amp; customers</option>
                  <option value="admin">Admin — company management too</option>
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="secondary" onClick={resetForm}>Cancel</AppButton>
              <AppButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding…' : 'Add team member'}
              </AppButton>
            </div>
          </form>
        </Modal>
=======
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0B234A]">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">Everyone with access to {company?.settings.companyName || 'your company'}.</p>
        </div>
        {canManage && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0B234A]">Add Team Member</h2>
            <button type="button" onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            If this email already has an account, they\u2019ll simply be added to your company — their existing
            password stays unchanged. Otherwise a new account is created with the password you set below, and
            they\u2019ll be asked to change it the first time they log in.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" required>
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" required />
            </Field>
            <Field label="Full Name">
              <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Password" required>
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
            </Field>
            <Field label="Role" required>
              <Select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}>
                <option value="staff">Staff — quotations &amp; customers</option>
                <option value="admin">Admin — company management too</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg disabled:opacity-60">
              {isSubmitting ? 'Adding…' : 'Add Team Member'}
            </button>
          </div>
        </form>
>>>>>>> origin/main
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading team…</div>
      ) : (
        <>
          {/* Desktop table */}
<<<<<<< HEAD
          <div className="hidden overflow-x-auto rounded-2xl border border-[#E6E8EC] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)] md:block">
            <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
              <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                <tr>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Name</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Email</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Role</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-white">Status</th>
                  {canManage && <th className="px-4 py-3.5 text-center font-semibold text-white">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EC] bg-white">
                {pagedMembers.map((m) => (
                  <tr key={m.userId} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 text-[#17243A]">{m.fullName || '\u2014'}</td>
                    <td className="px-4 py-3.5 text-[#344054]">{m.email}</td>
                    <td className="px-4 py-3.5">
=======
          <div className="hidden md:block overflow-x-auto bg-white border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  {canManage && <th className="px-4 py-3 text-center font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.userId} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">{m.fullName || '\u2014'}</td>
                    <td className="px-4 py-3 text-slate-700">{m.email}</td>
                    <td className="px-4 py-3">
>>>>>>> origin/main
                      {canManage && m.role !== 'owner' ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m, e.target.value as 'admin' | 'staff')}
<<<<<<< HEAD
                          className="rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-xs capitalize text-[#17243A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25"
=======
                          className="text-xs border border-slate-200 rounded px-2 py-1 capitalize"
>>>>>>> origin/main
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </td>
<<<<<<< HEAD
                    <td className="px-4 py-3.5">
=======
                    <td className="px-4 py-3">
>>>>>>> origin/main
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {m.isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        {m.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    {canManage && (
<<<<<<< HEAD
                      <td className="px-4 py-3.5 text-center">
                        {m.role !== 'owner' && (
                          <button
                            onClick={() => handleToggleActive(m)}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${m.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
=======
                      <td className="px-4 py-3 text-center">
                        {m.role !== 'owner' && (
                          <button
                            onClick={() => handleToggleActive(m)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg ${m.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
>>>>>>> origin/main
                          >
                            {m.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
<<<<<<< HEAD
            <div className="p-3">
              <TablePagination
                page={page}
                pageSize={TEAM_TABLE_PAGE_SIZE}
                total={members.length}
                onPageChange={setPage}
              />
            </div>
=======
>>>>>>> origin/main
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
<<<<<<< HEAD
            {pagedMembers.map((m) => (
=======
            {members.map((m) => (
>>>>>>> origin/main
              <div key={m.userId} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{m.fullName || m.email}</p>
                      <p className="text-xs text-slate-500 truncate">{m.email}</p>
                    </div>
                  </div>
                  <RoleBadge role={m.role} />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {m.isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    {m.isActive ? 'Active' : 'Deactivated'}
                  </span>
                  {canManage && m.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m, e.target.value as 'admin' | 'staff')}
                        className="text-xs border border-slate-200 rounded px-2 py-1 capitalize"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleToggleActive(m)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg ${m.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        {m.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
<<<<<<< HEAD

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Deactivate Team Member?"
        message={`${pendingDeactivate?.fullName || pendingDeactivate?.email} will immediately lose access to ${company?.settings.companyName || 'this company'}. You can reactivate them at any time.`}
        danger
        confirmLabel="Deactivate"
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
=======
>>>>>>> origin/main
    </div>
  );
}
