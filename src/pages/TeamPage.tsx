import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, Modal, PageHeader, StatusPill } from '@/components/ui/DesignSystem';
import DataTable, { CellStack, CellText, RowActionButton, RowActions, type Column } from '@/components/ui/DataTable';
import { Field, Select, TextInput } from '@/components/ui/Form';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { addTeamMember, listTeamMembers, updateTeamMember, type TeamMember } from '@/services/team.service';
import { Plus, User, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';

const TEAM_TABLE_PAGE_SIZE = 10;

function RoleBadge({ role }: { role: TeamMember['role'] }) {
  const styles: Record<TeamMember['role'], string> = {
    owner: 'bg-[#1D4ED8]/10 text-[var(--primary)]',
    admin: 'bg-[var(--primary-soft)] text-[var(--primary)]',
    staff: 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
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
  const [pendingDeactivate, setPendingDeactivate] = useState<TeamMember | null>(null);
  const [page, setPage] = useState(1);

  const canManage = company?.callerRole === 'owner' || company?.callerRole === 'admin';

  const refresh = async () => {
    if (!company) return;
    setLoading(true);
    setMembers(await listTeamMembers(company.companyId));
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [company?.companyId]);


  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(members.length / TEAM_TABLE_PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [members.length, page]);

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
      : 'Existing account added to your company successfully.');
    resetForm();
    void refresh();
  };

  const handleToggleActive = async (member: TeamMember) => {
    if (!company) return;
    if (member.isActive) {
      setPendingDeactivate(member);
      return;
    }
    const result = await updateTeamMember(company.companyId, member.userId, { isActive: true });
    if (!result.ok) {
      push('error', result.error || 'Could not update team member.');
      return;
    }
    push('success', 'Team member reactivated successfully. Access has been restored.');
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
    push('success', 'Team member deactivated successfully. They can no longer sign in to this company.');
    void refresh();
  };

  const handleRoleChange = async (member: TeamMember, newRole: 'admin' | 'staff') => {
    if (!company) return;
    const result = await updateTeamMember(company.companyId, member.userId, { role: newRole });
    if (!result.ok) {
      push('error', result.error || 'Could not update role.');
      return;
    }
    push('success', 'Team member role updated successfully.');
    void refresh();
  };

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (m) => m.fullName || m.email,
      cell: (m) => <CellStack title={m.fullName || m.email} />,
    },
    {
      key: 'email',
      header: 'Email',
      sortValue: (m) => m.email,
      cell: (m) => <CellText>{m.email}</CellText>,
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (m) => m.role,
      cell: (m) =>
        canManage && m.role !== 'owner' ? (
          <select
            value={m.role}
            onChange={(e) => handleRoleChange(m, e.target.value as 'admin' | 'staff')}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Role for ${m.fullName || m.email}`}
            className="input-shell !min-h-[32px] !w-auto !rounded-lg !px-2.5 !py-1 text-xs capitalize"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <RoleBadge role={m.role} />
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (m) => (m.isActive ? 'Active' : 'Deactivated'),
      cell: (m) => <StatusPill label={m.isActive ? 'Active' : 'Deactivated'} tone={m.isActive ? 'success' : 'neutral'} />,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: 'Actions',
            kind: 'actions' as const,
            cell: (m: TeamMember) =>
              m.role !== 'owner' ? (
                <RowActions>
                  <RowActionButton
                    label={m.isActive ? 'Deactivate member' : 'Reactivate member'}
                    tone={m.isActive ? 'danger' : 'default'}
                    icon={m.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    onClick={() => handleToggleActive(m)}
                  />
                </RowActions>
              ) : null,
          },
        ]
      : []),
  ];

  return (
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
            <p className="text-xs text-[var(--text-muted)]">
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
      )}

      <DataTable
        caption="Team members"
        columns={columns}
        rows={members}
        rowKey={(m) => m.userId}
        loading={loading}
        defaultSort={{ key: 'name', direction: 'asc' }}
        pagination={{ page, pageSize: TEAM_TABLE_PAGE_SIZE, onPageChange: setPage }}
        empty={{ icon: <User className="h-5 w-5" />, title: 'No team members yet', description: 'Add a team member to give them access to this company.' }}
      />

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Deactivate Team Member?"
        message={`${pendingDeactivate?.fullName || pendingDeactivate?.email} will immediately lose access to ${company?.settings.companyName || 'this company'}. You can reactivate them at any time.`}
        danger
        confirmLabel="Deactivate team member"
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}

