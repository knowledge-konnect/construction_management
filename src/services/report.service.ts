import { apiGet } from '@/services/apiClient';

export interface ReportMonthSnapshot {
    label: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

export interface ReportSummary {
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    projectsTracked: number;
    projectsAtRisk: number;
    months: ReportMonthSnapshot[];
}

export interface DashboardReport {
    projectsCount: number;
    activeProjects: number;
    totalContract: number;
    totalBilled: number;
    totalOutstanding: number;
    totalCollected: number;
    totalExpenses: number;
    netCashFlow: number;
    collectionEfficiency: number;
    totalCost: number;
    totalCollections: number;
    supplierOutstanding: number;
    projectSummaries: DashboardProjectSummary[];
}

export interface DashboardProjectSummary {
    projectId: string;
    projectName: string;
    contractValue: number;
    billed: number;
    collected: number;
    outstanding: number;
    expenses: number;
    netCashFlow: number;
}

export interface MonthlyFinancialEntry {
    month: string;
    billed: number;
    collected: number;
    expenses: number;
    netCashFlow: number;
}

export interface MonthlyFinancialReport {
    summary: {
        totalBilled: number;
        totalCollected: number;
        totalExpenses: number;
        totalOutstanding: number;
        netCashFlow: number;
    };
    monthly: MonthlyFinancialEntry[];
}

export interface DefaulterReportRow {
    customerId: string;
    customerName: string;
    outstanding: number;
    invoices: number;
    dueInvoices: number;
}

export interface CompanyReceiptRow {
    id: string;
    projectId: string | null;
    customerId: string | null;
    receiptNumber: string;
    amount: number;
    receivedDate: string | null;
    paymentMethodId: string | null;
    paymentMethod: string;
    referenceNumber: string | null;
    notes: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    voidedAt: string | null;
    allocatedAmount?: number;
    unallocatedAmount?: number;
    project?: {
        id: string;
        name: string;
        projectNumber?: string | null;
    } | null;
    customer?: {
        id: string;
        name: string;
    } | null;
}

export interface ReportFilters {
    from?: string;
    to?: string;
    projectId?: string;
    status?: string;
}

export interface ProjectReportRow {
    id: string;
    name: string;
    project_number?: string | null;
    contract_amount?: number | null;
    budget_amount?: number | null;
    status?: string | null;
    start_date?: string | null;
    created_at?: string | null;
    expected_end_date?: string | null;
}

export interface ExpenseReportRow {
    id: string;
    project_id?: string | null;
    category?: string | null;
    description?: string | null;
    outstandingAmount?: number | null;
    supplier_name?: string | null;
    supplier_bill_number?: string | null;
    bill_date?: string | null;
    due_date?: string | null;
    bill_amount?: number | null;
    status?: string | null;
    created_at?: string | null;
}

export interface CollectionReportRow {
    id: string;
    project_id?: string | null;
    receipt_number?: string | null;
    amount?: number | null;
    received_date?: string | null;
    created_at?: string | null;
    voided_at?: string | null;
}

function buildQuery(filters?: ReportFilters): string {
    if (!filters) return '';
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.status) params.set('status', filters.status);
    const query = params.toString();
    return query ? `?${query}` : '';
}

export async function getReportSummary(): Promise<ReportSummary | null> {
    const { data, error } = await apiGet<{ summary: ReportSummary }>('/api/reports/summary');
    if (error || !data?.summary) {
        console.warn('Failed to load report summary', error);
        return null;
    }

    return data.summary;
}

export async function getDashboardReport(): Promise<DashboardReport | null> {
    const { data, error } = await apiGet<{ dashboard: DashboardReport }>('/api/reports/dashboard');
    if (error || !data?.dashboard) {
        console.warn('Failed to load dashboard report', error);
        return null;
    }
    return data.dashboard;
}

export async function getMonthlyFinancialReport(): Promise<MonthlyFinancialReport | null> {
    const { data, error } = await apiGet<MonthlyFinancialReport>('/api/reports/monthly');
    if (error || !data || !Array.isArray(data.monthly)) {
        console.warn('Failed to load monthly financial report', error);
        return null;
    }
    return data;
}

export async function getDefaultersReport(): Promise<DefaulterReportRow[]> {
    const { data, error } = await apiGet<{ defaulters?: DefaulterReportRow[] }>('/api/reports/defaulters');
    if (error || !Array.isArray(data?.defaulters)) {
        console.warn('Failed to load defaulter report', error);
        return [];
    }
    return data.defaulters;
}

export async function getProjectsReport(filters?: ReportFilters): Promise<ProjectReportRow[]> {
    const { data, error } = await apiGet<{ projects?: ProjectReportRow[] }>(`/api/reports/projects${buildQuery(filters)}`);
    if (error || !Array.isArray(data?.projects)) {
        console.warn('Failed to load projects report', error);
        return [];
    }
    return data.projects;
}

export async function getExpensesReport(filters?: ReportFilters): Promise<{ expenses: any[]; total: number }> {
    const { data, error } = await apiGet<{ expenses?: ExpenseReportRow[]; total?: number }>(`/api/reports/expenses${buildQuery(filters)}`);
    if (error || !data) {
        console.warn('Failed to load expenses report', error);
        return { expenses: [], total: 0 };
    }
    return { expenses: data.expenses ?? [], total: Number(data.total ?? 0) };
}

export async function getCollectionsReport(filters?: ReportFilters): Promise<{ receipts: any[]; total: number }> {
    const { data, error } = await apiGet<{ receipts?: CollectionReportRow[]; total?: number }>(`/api/reports/collections${buildQuery(filters)}`);
    if (error || !data) {
        console.warn('Failed to load collections report', error);
        return { receipts: [], total: 0 };
    }
    return { receipts: data.receipts ?? [], total: Number(data.total ?? 0) };
}

export async function getSupplierOutstandingReport(projectId?: string): Promise<{ outstanding: any[]; totalOutstanding: number }> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const { data, error } = await apiGet<{ outstanding?: any[]; totalOutstanding?: number }>(`/api/reports/supplier-outstanding${query}`);
    if (error || !data) {
        console.warn('Failed to load supplier outstanding report', error);
        return { outstanding: [], totalOutstanding: 0 };
    }
    return { outstanding: data.outstanding ?? [], totalOutstanding: Number(data.totalOutstanding ?? 0) };
}

export async function getProjectFinancials(projectId: string): Promise<{ contractValue: number; projectBudget: number; actualCost: number; customerCollections: number; investorContributions: number; expectedProjectMargin: number | null; cashBasedProfitLoss: number; budgetRemaining: number; budgetUtilization: number; netCashFlow: number } | null> {
    const { data, error } = await apiGet<{ summary?: any }>(`/api/reports/project-financials?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.summary) {
        console.warn('Failed to load project financial report', error);
        return null;
    }
    return {
        contractValue: Number(data.summary.contractValue ?? 0),
        projectBudget: Number(data.summary.projectBudget ?? 0),
        actualCost: Number(data.summary.actualCost ?? 0),
        customerCollections: Number(data.summary.customerCollections ?? 0),
        investorContributions: Number(data.summary.investorContributions ?? 0),
        expectedProjectMargin: data.summary.expectedProjectMargin == null ? null : Number(data.summary.expectedProjectMargin),
        cashBasedProfitLoss: Number(data.summary.cashBasedProfitLoss ?? 0),
        budgetRemaining: Number(data.summary.budgetRemaining ?? 0),
        budgetUtilization: Number(data.summary.budgetUtilization ?? 0),
        netCashFlow: Number(data.summary.netCashFlow ?? 0),
    };
}

export async function getCompanySummary(filters?: ReportFilters): Promise<{ projectsTracked: number; quotationRevenue: number; expenseTotal: number; profitEstimate: number } | null> {
    const { data, error } = await apiGet<{ summary?: any }>(`/api/reports/company-summary${buildQuery(filters)}`);
    if (error || !data?.summary) {
        console.warn('Failed to load company summary report', error);
        return null;
    }
    return {
        projectsTracked: Number(data.summary.projectsTracked ?? 0),
        quotationRevenue: Number(data.summary.quotationRevenue ?? 0),
        expenseTotal: Number(data.summary.expenseTotal ?? 0),
        profitEstimate: Number(data.summary.profitEstimate ?? 0),
    };
}

export async function getCompanyReceipts(filters?: { projectId?: string | null; customerId?: string | null }): Promise<CompanyReceiptRow[]> {
    const params = new URLSearchParams();
    if (filters?.projectId !== undefined) params.set('projectId', filters.projectId === null ? 'null' : filters.projectId);
    if (filters?.customerId !== undefined) params.set('customerId', filters.customerId === null ? 'null' : filters.customerId);
    const query = params.toString();

    const { data, error } = await apiGet<{ receipts?: CompanyReceiptRow[] }>(`/api/receipts${query ? `?${query}` : ''}`);
    if (error || !Array.isArray(data?.receipts)) {
        console.warn('Failed to load company receipts', error);
        return [];
    }

    return data.receipts;
}
