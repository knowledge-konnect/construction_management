import { apiGet } from '@/services/apiClient';

export type ExternalProjectSummary = {
    id: string;
    name: string;
    status: string;
    siteAddress: string | null;
    description: string | null;
    startDate: string | null;
    expectedEndDate: string | null;
    actualEndDate: string | null;
    projectTypeSnapshot: string | null;
    progressPercent: number | null;
    milestoneCount: number;
    updateCount: number;
    documentCount: number;
    totalContractValue: number | null;
    amountPaidByClient: number | null;
    outstandingAmount: number | null;
    nextPaymentDueDate: string | null;
    paymentHistory: Array<{ id: string; date: string | null; amount: number; reference: string | null }>;
    myInvestment: number | null;
    myFundingHistory: Array<{ id: string; date: string | null; amount: number; reference: string | null }>;
    milestones: Array<{ id: string; name: string; status: string; targetDate: string | null; completionPercent: number | null }>;
    updates: Array<{ id: string; title: string; message: string | null; createdAt: string | null }>;
    documents: Array<{ id: string; name: string; fileType: string | null; createdAt: string | null }>;
};

export async function listExternalProjects(): Promise<ExternalProjectSummary[]> {
    const { data, error } = await apiGet<{ projects?: ExternalProjectSummary[] }>('/api/external/projects');
    if (error || !data?.projects) {
        console.warn('Failed to load external dashboard projects', error);
        return [];
    }
    return data.projects;
}
