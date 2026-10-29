import { apiGet, apiPost, apiPut } from '@/services/apiClient';

export type CompanyRole = 'owner' | 'admin' | 'staff';

export interface TeamMember {
  userId: string;
  email: string;
  fullName: string | null;
  role: CompanyRole;
  isActive: boolean;
  createdAt: string;
}

export async function listTeamMembers(companyId: string): Promise<TeamMember[]> {
  const { data, error } = await apiGet<{ members: any[] }>(`/api/company/${companyId}/users`);
  if (error || !data) {
    console.warn('Failed to load team members', error);
    return [];
  }
  return (data.members ?? []).map((m) => ({
    userId: m.userId,
    email: m.email,
    fullName: m.fullName,
    role: m.role,
    isActive: m.isActive,
    createdAt: m.createdAt,
  }));
}

export interface AddTeamMemberInput {
  email: string;
  fullName?: string;
  password?: string;
  role: 'admin' | 'staff';
}

export interface AddTeamMemberResult {
  ok: boolean;
  error?: string;
  isNewAccount?: boolean;
}

export async function addTeamMember(companyId: string, input: AddTeamMemberInput): Promise<AddTeamMemberResult> {
  const { data, error } = await apiPost<{ member: { isNewAccount: boolean } }>(`/api/company/${companyId}/users`, input);
  if (error || !data) {
    return { ok: false, error: error ?? 'Could not add team member.' };
  }
  return { ok: true, isNewAccount: data.member.isNewAccount };
}

export async function updateTeamMember(
  companyId: string,
  userId: string,
  updates: { role?: 'admin' | 'staff'; isActive?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await apiPut<{ ok: boolean }>(`/api/company/${companyId}/users/${userId}`, updates);
  if (error) {
    return { ok: false, error };
  }
  return { ok: true };
}
