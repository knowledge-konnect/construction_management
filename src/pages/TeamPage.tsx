import { Field, Select, TextInput } from '@/components/ui/Form';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { addTeamMember, listTeamMembers, updateTeamMember, type TeamMember } from '@/services/team.service';
import { Plus, ShieldCheck, User, UserX, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function RoleBadge({ role }: { role: TeamMember['role'] }) {
  const styles: Record<TeamMember['role'], string> = {
    owner: 'bg-[#0B2857]/10 text-[#0B2857]',
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

  const canManage = company?.callerRole === 'owner' || company?.callerRole === 'admin';

  const refresh = async () => {
    if (!company) return;
    setLoading(true);
    setMembers(await listTeamMembers(company.companyId));
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [company?.companyId]);

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
    const result = await updateTeamMember(company.companyId, member.userId, { isActive: !member.isActive });
    if (!result.ok) {
      push('error', result.error || 'Could not update team member.');
      return;
    }
    push('success', member.isActive ? 'Team member deactivated.' : 'Team member reactivated.');
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
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading team…</div>
      ) : (
        <>
          {/* Desktop table */}
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
                      {canManage && m.role !== 'owner' ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m, e.target.value as 'admin' | 'staff')}
                          className="text-xs border border-slate-200 rounded px-2 py-1 capitalize"
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {m.isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        {m.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-center">
                        {m.role !== 'owner' && (
                          <button
                            onClick={() => handleToggleActive(m)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg ${m.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
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
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {members.map((m) => (
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
    </div>
  );
}
