import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, EmptyState, Modal, PremiumCard, SkeletonRow, StatusPill } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { BUSINESS_MODEL_OPTIONS, calculateProjectedMargin } from '@/lib/businessModels';
import { type FlatBilling } from '@/lib/flatBilling';
import { type Quotation } from '@/lib/models';
import { formatDate, formatINR } from '@/lib/utils';
import { listDocuments } from '@/services/document.service';
import { listFlatBillings } from '@/services/flatBilling.service';
import { listParties, type PartyRecord } from '@/services/party.service';
import { getProject, type ProjectRecord } from '@/services/project.service';
import {
    cancelPurchaseOrder,
    createInvestorContribution,
    createMaterialReceipt,
    createProjectAttachment,
    createProjectClientAccessResult,
    createProjectExpense,
    createProjectInvestorResult,
    createProjectProgressUpdate,
    createProjectReceipt,
    createProjectStage,
    createPurchaseOrder,
    deleteInvestorContribution,
    deleteMaterialReceipt,
    deleteProjectAttachment,
    deleteProjectExpense,
    deleteProjectInvestor,
    deleteProjectInvestorResult,
    deleteProjectProgressUpdate,
    deleteProjectReceipt,
    deleteProjectStage,
    listInvestorContributions,
    listMaterialReceipts,
    listProjectAttachments,
    listProjectClientAccess,
    listProjectExpensePayments,
    listProjectExpenses,
    listProjectInvestors,
    listProjectProgressUpdates,
    listProjectReceipts,
    listProjectStages,
    listPurchaseOrdersForProject,
    revokeProjectClientAccessResult,
    updateInvestorContribution,
    updateProjectExpense,
    updateProjectInvestor,
    updateProjectProgressUpdate,
    updateProjectReceipt,
    updateProjectStage,
    updatePurchaseOrderStatus,
    type InvestorContributionRecord,
    type MaterialReceiptRecord,
    type ProjectAttachmentRecord,
    type ProjectClientAccessRecord,
    type ProjectExpenseRecord,
    type ProjectExpenseStatus,
    type ProjectInvestorRecord,
    type ProjectProgressUpdateRecord,
    type ProjectProgressVisibility,
    type ProjectReceiptPaymentMethod,
    type ProjectReceiptRecord,
    type ProjectStageRecord,
    type ProjectStageStatus,
    type PurchaseOrderRecord
} from '@/services/projectCost.service';
import { createProjectUnit, deleteProjectUnit, listProjectUnits, updateProjectUnit, type ProjectUnitRecord } from '@/services/projectUnit.service';
import { ArrowUpRight, CalendarClock, FileText, FolderKanban, Link2, MessageCircle, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const stageStatuses: ProjectStageStatus[] = ['pending', 'in_progress', 'completed', 'on_hold'];
const progressVisibilityStatuses: ProjectProgressVisibility[] = ['draft', 'published'];
const expenseStatuses: ProjectExpenseStatus[] = ['unpaid', 'partially_paid', 'paid', 'void'];
const receiptMethods: ProjectReceiptPaymentMethod[] = ['cash', 'upi', 'bank_transfer', 'cheque', 'other'];

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none focus:border-[#1D4ED8]';
const labelClass = 'mb-1.5 block text-sm font-medium text-[#344054]';
const tableEditButtonClass = '!px-2.5 !py-1.5 !bg-slate-100 hover:!bg-slate-200 !border !border-slate-200';
const tableDeleteButtonClass = '!px-2.5 !py-1.5 !bg-red-100 hover:!bg-red-200 !border !border-red-200';

const asInputDate = (value?: string | null) => (value ? value.slice(0, 10) : '');

const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return parseNumber(trimmed);
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className={labelClass}>{label}{required ? <span className="text-red-600"> *</span> : null}</span>
            {children}
        </label>
    );
}

export const projectTabs = [
    'Overview',
    'Progress',
    'Budget',
    'Inventory',
    'Documents',
    'People',
] as const;

export type ProjectTab = (typeof projectTabs)[number];

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

const stageStatusLabelMap: Record<ProjectStageStatus, string> = {
    pending: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold',
};

export function ProjectOverviewPanel({ project }: { project: ProjectRecord }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [landownerParty, setLandownerParty] = useState<PartyRecord | null>(null);
    const [materialSupplySnapshot, setMaterialSupplySnapshot] = useState<{
        orderValue: number | null;
        pendingDeliveryQuantity: number | null;
        deliveryStatus: string | null;
    }>({
        orderValue: null,
        pendingDeliveryQuantity: null,
        deliveryStatus: null,
    });

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                let nextLandowner: PartyRecord | null = null;
                let nextMaterialSupplySnapshot = {
                    orderValue: null as number | null,
                    pendingDeliveryQuantity: null as number | null,
                    deliveryStatus: null as string | null,
                };

                if (project.businessModel === 'property_development' && project.developmentArrangement === 'joint_development' && project.landownerPartyId) {
                    const parties = await listParties();
                    nextLandowner = parties.find((party) => party.id === project.landownerPartyId) ?? null;
                }

                if (project.businessModel === 'material_supply') {
                    const [purchaseOrders, materialReceipts] = await Promise.all([
                        listPurchaseOrdersForProject(project.id),
                        listMaterialReceipts(project.id),
                    ]);

                    const orderValue = purchaseOrders.length > 0
                        ? purchaseOrders.reduce((sum, row) => sum + Number(row.totalAmount ?? 0), 0)
                        : null;

                    const totalOrderedQuantity = purchaseOrders.reduce(
                        (sum, purchaseOrder) => sum + purchaseOrder.lineItems.reduce((lineSum, line) => lineSum + Number(line.quantity ?? 0), 0),
                        0,
                    );

                    const totalAcceptedQuantity = materialReceipts.reduce(
                        (sum, receipt) => sum + receipt.lineItems.reduce((lineSum, line) => lineSum + Number(line.acceptedQuantity ?? 0), 0),
                        0,
                    );

                    const pendingDeliveryQuantity = purchaseOrders.length > 0
                        ? Math.max(totalOrderedQuantity - totalAcceptedQuantity, 0)
                        : null;

                    let deliveryStatus: string | null = null;
                    if (purchaseOrders.length > 0) {
                        if (pendingDeliveryQuantity === 0 && totalOrderedQuantity > 0) {
                            deliveryStatus = 'Completed';
                        } else if (totalAcceptedQuantity > 0) {
                            deliveryStatus = 'In progress';
                        } else {
                            deliveryStatus = 'Not started';
                        }
                    }

                    nextMaterialSupplySnapshot = {
                        orderValue,
                        pendingDeliveryQuantity,
                        deliveryStatus,
                    };
                }

                if (!active) return;
                setLandownerParty(nextLandowner);
                setMaterialSupplySnapshot(nextMaterialSupplySnapshot);
            } catch (err) {
                console.error(err);
                if (!active) return;
                setError('Could not load overview summary right now.');
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [project.id, project.businessModel, project.developmentArrangement, project.landownerPartyId]);

    const businessTypeLabel = BUSINESS_MODEL_OPTIONS.find((option) => option.value === project.businessModel)?.label ?? 'Not selected';
    const developmentTypeLabel = project.businessModel === 'property_development'
        ? project.developmentArrangement === 'joint_development'
            ? 'Joint development'
            : 'Self'
        : 'N/A';

    const projectedProfit = calculateProjectedMargin({
        businessModel: (project.businessModel ?? 'contract_construction'),
        developmentArrangement: project.developmentArrangement ?? 'self',
        contractAmount: project.contractAmount,
        budgetAmount: project.budgetAmount ?? '',
        projectedSalesValue: project.projectedSalesValue,
        landCost: project.landCost,
    });

    const formatCurrencyValue = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return formatINR(Number(value));
    };

    const formatCountValue = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return String(value);
    };

    const kpiCards = useMemo(() => {
        switch (project.businessModel) {
            case 'property_development': {
                const commonPropertyCards = [
                    { label: 'Total Project Flats', value: formatCountValue(project.totalProjectFlats), tone: 'Projected baseline' },
                    { label: 'Estimated Construction Cost', value: project.budgetAmount == null ? 'N/A' : formatCurrencyValue(project.budgetAmount), tone: 'Projected' },
                    { label: 'Projected Profit', value: projectedProfit === null ? 'N/A' : formatCurrencyValue(projectedProfit), tone: 'Projected' },
                ];

                if (project.developmentArrangement === 'joint_development') {
                    return [
                        { label: 'Builder Share Flats', value: formatCountValue(project.builderShareUnits), tone: 'Allocation' },
                        { label: 'Landowner Share Flats', value: formatCountValue(project.landownerShareUnits), tone: 'Allocation' },
                        { label: 'Builder Share Expected Sales Value', value: formatCurrencyValue(project.projectedSalesValue), tone: 'Projected revenue' },
                        ...commonPropertyCards,
                    ];
                }

                return [
                    { label: 'Expected Sales Value', value: formatCurrencyValue(project.projectedSalesValue), tone: 'Projected revenue' },
                    { label: 'Land Purchase Cost', value: formatCurrencyValue(project.landCost), tone: 'Projected cost' },
                    ...commonPropertyCards,
                ];
            }
            case 'civil_works_contract':
                return [
                    { label: 'Contract Amount', value: formatCurrencyValue(project.contractAmount), tone: 'Projected revenue' },
                    { label: 'Project Budget', value: project.budgetAmount == null ? 'N/A' : formatCurrencyValue(project.budgetAmount), tone: 'Projected cost' },
                    { label: 'Projected Profit', value: projectedProfit === null ? 'N/A' : formatCurrencyValue(projectedProfit), tone: 'Projected' },
                ];
            case 'material_supply':
                return [
                    { label: 'Order Value', value: materialSupplySnapshot.orderValue == null ? 'N/A' : formatCurrencyValue(materialSupplySnapshot.orderValue), tone: 'Order summary' },
                    { label: 'Delivery Status', value: materialSupplySnapshot.deliveryStatus ?? 'N/A', tone: 'Execution' },
                    { label: 'Pending Delivery', value: materialSupplySnapshot.pendingDeliveryQuantity == null ? 'N/A' : `${materialSupplySnapshot.pendingDeliveryQuantity} units`, tone: 'Execution' },
                ];
            case 'contract_construction':
            default:
                return [
                    { label: 'Contract Value', value: formatCurrencyValue(project.contractAmount), tone: 'Projected revenue' },
                    { label: 'Project Budget', value: project.budgetAmount == null ? 'N/A' : formatCurrencyValue(project.budgetAmount), tone: 'Projected cost' },
                    { label: 'Projected Profit', value: projectedProfit === null ? 'N/A' : formatCurrencyValue(projectedProfit), tone: 'Projected' },
                ];
        }
    }, [materialSupplySnapshot.deliveryStatus, materialSupplySnapshot.orderValue, materialSupplySnapshot.pendingDeliveryQuantity, project.budgetAmount, project.builderShareUnits, project.businessModel, project.contractAmount, project.developmentArrangement, project.landCost, project.landownerShareUnits, project.projectedSalesValue, project.totalProjectFlats, projectedProfit]);

    const overviewFields = [
        { label: 'Project number', value: project.projectNumber || 'Pending' },
        { label: 'Project category', value: project.projectTypeSnapshot || 'Not selected' },
        { label: 'Business type', value: businessTypeLabel },
        { label: 'Development type', value: developmentTypeLabel },
        { label: 'Project address', value: project.siteAddress || 'Address pending' },
        { label: 'Status', value: statusLabelMap[project.status] ?? project.status },
        { label: 'Start date', value: project.startDate ? formatDate(project.startDate) : 'Pending' },
        { label: 'Expected completion', value: project.expectedEndDate ? formatDate(project.expectedEndDate) : 'Pending' },
    ];

    return (
        <div className="space-y-6">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {kpiCards.map((item) => (
                    <PremiumCard key={item.label} className="p-5">
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#667085]">{item.label}</p>
                            <span className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1D4ED8]">
                                {item.tone}
                            </span>
                        </div>
                        {loading ? <SkeletonRow className="mt-4 h-7 w-24" /> : <p className="mt-4 text-xl font-semibold text-[#17243A]">{item.value}</p>}
                    </PremiumCard>
                ))}
            </div>

            <div className="grid gap-4">
                <PremiumCard className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#667085]">Project overview</p>
                        <StatusPill label={statusLabelMap[project.status] ?? project.status} tone={statusToneMap[project.status] ?? 'neutral'} />
                    </div>
                    <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#17243A]">{project.name}</h2>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {overviewFields.map((field) => (
                            <div key={field.label} className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">{field.label}</dt>
                                <dd className="mt-1 text-sm font-medium text-[#17243A]">{field.value}</dd>
                            </div>
                        ))}
                    </dl>
                    <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Project notes</p>
                        <p className="mt-2 text-sm text-[#344054]">{project.description || 'No notes yet.'}</p>
                    </div>
                </PremiumCard>
            </div>

            {project.businessModel === 'property_development' && project.developmentArrangement === 'joint_development' && (
                <PremiumCard className="p-5">
                    <p className="text-base font-semibold text-[#17243A]">Joint development details</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Landowner</p>
                            <p className="mt-1 text-sm font-medium text-[#17243A]">{landownerParty?.name || 'Not assigned'}</p>
                        </div>
                        <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Total flats</p>
                            <p className="mt-1 text-sm font-medium text-[#17243A]">{project.totalProjectFlats ?? 'N/A'}</p>
                        </div>
                        <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Builder's flats</p>
                            <p className="mt-1 text-sm font-medium text-[#17243A]">{project.builderShareUnits ?? 'N/A'}</p>
                        </div>
                        <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Landowner's flats</p>
                            <p className="mt-1 text-sm font-medium text-[#17243A]">{project.landownerShareUnits ?? 'N/A'}</p>
                        </div>
                        <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">JDA agreement number</p>
                            <p className="mt-1 text-sm font-medium text-[#17243A]">{project.jdaAgreementReference || 'N/A'}</p>
                        </div>
                        <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">JDA agreement date</p>
                            <p className="mt-1 text-sm font-medium text-[#17243A]">{project.jdaAgreementDate ? formatDate(project.jdaAgreementDate) : 'N/A'}</p>
                        </div>
                        <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5 md:col-span-2 xl:col-span-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">JDA document link</p>
                            {project.jdaAgreementDocumentUrl ? (
                                <a href={project.jdaAgreementDocumentUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#1D4ED8] underline-offset-2 hover:underline">
                                    {project.jdaAgreementDocumentUrl}
                                    <Link2 className="h-3.5 w-3.5" />
                                </a>
                            ) : (
                                <p className="mt-1 text-sm font-medium text-[#17243A]">N/A</p>
                            )}
                        </div>
                    </div>
                </PremiumCard>
            )}
        </div>
    );
}

export function ProjectExecutionPanel({ projectId }: { projectId: string }) {
    return (
        <div className="space-y-4">
            <PremiumCard className="p-4">
                <p className="text-base font-semibold text-[#17243A]">Execution</p>
                <p className="mt-1 text-sm text-[#667085]">Track stages and site updates.</p>
            </PremiumCard>
            <ProjectStagePanel projectId={projectId} />
            <ProjectProgressPanel projectId={projectId} />
        </div>
    );
}

export function ProjectFinancePanel({
    projectId,
    customerMobile,
    projectName,
    contractValue = 0,
    projectBudget = 0,
    onManageExpenses,
    onManageInvoices,
    onManageReceipts,
}: {
    projectId: string;
    customerMobile?: string | null;
    projectName?: string;
    contractValue?: number | null;
    projectBudget?: number | null;
    onManageExpenses: () => void;
    onManageInvoices: () => void;
    onManageReceipts: () => void;
}) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        businessModel: 'contract_construction' as NonNullable<ProjectRecord['businessModel']>,
        projectBudget: 0,
        hasProjectBudget: false,
        actualCost: 0,
        customerCollections: 0,
        supplierPayments: 0,
        hasInvestors: false,
        investorFunding: 0,
        budgetRemaining: 0,
        budgetUtilization: 0,
        netCashFlow: 0,
    });

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            try {
                const [projectRow, expenseRows, receiptRows, investorRows] = await Promise.all([
                    getProject(projectId),
                    listProjectExpenses(projectId),
                    listProjectReceipts(projectId),
                    listProjectInvestors(projectId),
                ]);

                const contributionLists = await Promise.all(investorRows.map(async (investor) => listInvestorContributions(investor.id)));
                const expensePaymentLists = await Promise.all(expenseRows.map(async (expense) => listProjectExpensePayments(expense.id)));
                const investorFunding = contributionLists.flat().reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
                const supplierPayments = expensePaymentLists
                    .flat()
                    .filter((row) => !row.voidedAt)
                    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
                const actualCost = expenseRows.filter((row) => row.status !== 'void').reduce((sum, row) => sum + Number(row.billAmount ?? 0), 0);
                const customerCollections = receiptRows.filter((row) => !row.voidedAt).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
                const projectBudgetValue = Number(projectRow?.budgetAmount ?? projectBudget ?? 0);
                const businessModel = projectRow?.businessModel ?? 'contract_construction';
                const hasProjectBudget = projectRow?.budgetAmount !== null && projectRow?.budgetAmount !== undefined;
                const budgetRemaining = projectBudgetValue - actualCost;
                const budgetUtilization = projectBudgetValue > 0 ? (actualCost / projectBudgetValue) * 100 : 0;
                const netCashFlow = customerCollections - actualCost;

                if (!active) return;
                setSummary({
                    businessModel,
                    projectBudget: projectBudgetValue,
                    hasProjectBudget,
                    actualCost,
                    customerCollections,
                    supplierPayments,
                    hasInvestors: investorRows.length > 0,
                    investorFunding,
                    budgetRemaining,
                    budgetUtilization,
                    netCashFlow,
                });
            } catch (error) {
                console.error('Could not load project financial summary.', error);
                if (!active) return;
                setSummary({
                    businessModel: 'contract_construction',
                    projectBudget: 0,
                    hasProjectBudget: false,
                    actualCost: 0,
                    customerCollections: 0,
                    supplierPayments: 0,
                    hasInvestors: false,
                    investorFunding: 0,
                    budgetRemaining: 0,
                    budgetUtilization: 0,
                    netCashFlow: 0,
                });
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [projectId, contractValue, projectBudget]);

    const actualCost = summary.actualCost;
    const budgetRemaining = summary.projectBudget - actualCost;
    const budgetUtilization = summary.projectBudget > 0 ? (actualCost / summary.projectBudget) * 100 : 0;
    const showBudget = summary.hasProjectBudget || summary.businessModel !== 'material_supply';
    const showInvestorFunding = summary.hasInvestors || summary.businessModel === 'property_development';
    const showNetCashFlow = summary.businessModel !== 'material_supply';

    const financialSummaryCards = [
        ...(showBudget ? [{ label: 'Project budget', value: formatINR(summary.projectBudget) }] : []),
        { label: 'Actual expenses', value: formatINR(summary.actualCost) },
        { label: 'Actual customer receipts', value: formatINR(summary.customerCollections) },
        { label: 'Actual supplier payments', value: formatINR(summary.supplierPayments) },
        ...(showInvestorFunding ? [{ label: 'Investor contributions', value: formatINR(summary.investorFunding) }] : []),
        ...(showNetCashFlow ? [{ label: 'Net cash flow', value: formatINR(summary.netCashFlow) }] : []),
    ];

    return (
        <div className="space-y-6">
            <PremiumCard className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-base font-semibold text-[#17243A]">Financial summary</p>
                    <div className="flex flex-wrap gap-2">
                        <AppButton variant="secondary" onClick={onManageInvoices}>Open Invoices</AppButton>
                        <AppButton variant="secondary" onClick={onManageReceipts}>Open Receipts</AppButton>
                    </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    {financialSummaryCards.map((item) => (
                        <div key={item.label} className="rounded-xl border border-[#E6E8EC] bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">{item.label}</p>
                            <p className="mt-2 text-base font-semibold text-[#17243A]">{loading ? '…' : item.value}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Budget remaining</p>
                        <p className="mt-2 text-base font-semibold text-[#17243A]">{loading ? '…' : formatINR(budgetRemaining)}</p>
                    </div>
                    <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Supplier payments settled</p>
                        <p className="mt-2 text-base font-semibold text-[#17243A]">{loading ? '…' : formatINR(summary.supplierPayments)}</p>
                    </div>
                </div>
                <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667085]">Budget status</p>
                            <p className="mt-1 text-sm text-[#344054]">{loading ? 'Loading budget summary…' : `${formatINR(Math.max(budgetRemaining, 0))} remaining against the project budget`}</p>
                        </div>
                        <StatusPill label={budgetRemaining >= 0 ? 'On track' : 'Over budget'} tone={budgetRemaining >= 0 ? 'success' : 'warning'} />
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[#1D4ED8]" style={{ width: `${summary.projectBudget > 0 ? Math.max(6, Math.min(100, budgetUtilization)) : 0}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-[#667085]">Budget utilization: {loading ? '…' : `${Math.min(100, Math.max(0, Math.round(budgetUtilization)))}%`}</p>
                </div>
            </PremiumCard>

            <PremiumCard className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-[#17243A]">Supplier expenses</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[#667085]">Read-only</span>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[#667085]">Project records only</span>
                        </div>
                    </div>
                    <AppButton variant="secondary" onClick={onManageExpenses}>
                        <ArrowUpRight className="h-4 w-4" />
                        Open Expenses
                    </AppButton>
                </div>
                <ProjectExpensePanel projectId={projectId} readOnly />
            </PremiumCard>

            <PremiumCard className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-[#17243A]">Customer receipts</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[#667085]">Read-only</span>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[#667085]">Project records only</span>
                        </div>
                    </div>
                    <AppButton variant="secondary" onClick={onManageReceipts}>
                        <ArrowUpRight className="h-4 w-4" />
                        Open Reports
                    </AppButton>
                </div>
                <ProjectReceiptPanel projectId={projectId} customerMobile={customerMobile} projectName={projectName} readOnly />
            </PremiumCard>

            <PremiumCard className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-[#17243A]">Procurement and delivery</p>
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-[#667085]">
                        Commitment only
                    </span>
                </div>
                <ProjectMaterialReceiptPanel projectId={projectId} />
            </PremiumCard>

            <PremiumCard className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-[#17243A]">Investors and contributions</p>
                        <p className="text-xs text-[#667085]">Investor funding linked to this project.</p>
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-[#667085]">
                        Project-scoped module
                    </span>
                </div>
                <ProjectInvestorsPanel projectId={projectId} />
            </PremiumCard>
        </div>
    );
}

export function ProjectMaterialReceiptPanel({ projectId }: { projectId: string }) {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
    const [materialReceipts, setMaterialReceipts] = useState<MaterialReceiptRecord[]>([]);
    const [supplierContacts, setSupplierContacts] = useState<PartyRecord[]>([]);
    const [selectedPoId, setSelectedPoId] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [poSaving, setPoSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [poModalOpen, setPoModalOpen] = useState(false);
    const [deleteReceiptId, setDeleteReceiptId] = useState<string | null>(null);
    const [lineInputs, setLineInputs] = useState<Record<string, { acceptedQuantity: string; rejectedQuantity: string; notes: string }>>({});
    const [poForm, setPoForm] = useState({
        supplierPartyId: '',
        poNumber: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
        orderDate: new Date().toISOString().slice(0, 10),
        expectedDeliveryDate: '',
        taxAmount: '0',
        notes: '',
        lineDescription: '',
        lineQuantity: '1',
        lineUnit: '',
        lineRate: '0',
    });
    const [form, setForm] = useState({
        receiptNumber: `MR-${Date.now()}`,
        receiptDate: '',
        deliveryReferenceNumber: '',
        notes: '',
    });
    const { push } = useToast();

    const loadData = async () => {
        setLoading(true);
        const [allPurchaseOrders, allReceipts] = await Promise.all([
            listPurchaseOrdersForProject(projectId),
            listMaterialReceipts(projectId),
        ]);

        setPurchaseOrders(allPurchaseOrders);
        setMaterialReceipts(allReceipts);
        const hasSelectedPo = allPurchaseOrders.some((po) => po.id === selectedPoId);
        if (!allPurchaseOrders.length) {
            setSelectedPoId('');
        } else if (!selectedPoId || !hasSelectedPo) {
            setSelectedPoId(allPurchaseOrders[0].id);
        }
        setLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, [projectId]);

    useEffect(() => {
        if (!poModalOpen) return;

        let active = true;
        const loadSupplierContacts = async () => {
            const contacts = await listParties(undefined, 'supplier', '', { activeOnly: true });
            if (!active) return;
            setSupplierContacts(contacts.filter((party) => party.isSupplier && party.isActive));
        };

        void loadSupplierContacts();
        return () => {
            active = false;
        };
    }, [poModalOpen]);

    const selectedPo = useMemo(
        () => purchaseOrders.find((po) => po.id === selectedPoId) ?? purchaseOrders[0] ?? null,
        [purchaseOrders, selectedPoId],
    );
    const selectedPoReceipts = useMemo(
        () => materialReceipts.filter((receipt) => (selectedPo ? receipt.purchaseOrderId === selectedPo.id : false)),
        [materialReceipts, selectedPo],
    );

    useEffect(() => {
        if (!selectedPo) {
            setLineInputs({});
            return;
        }

        const nextMap: Record<string, { acceptedQuantity: string; rejectedQuantity: string; notes: string }> = {};
        for (const line of selectedPo.lineItems) {
            const previous = selectedPoReceipts.reduce((sum, receipt) => {
                const matching = receipt.lineItems.find((item) => item.purchaseOrderLineId === line.id);
                return sum + Number(matching?.acceptedQuantity ?? 0);
            }, 0);
            nextMap[line.id] = {
                acceptedQuantity: String(Math.max(0, Number(line.quantity ?? 0) - previous)),
                rejectedQuantity: '0',
                notes: '',
            };
        }
        setLineInputs(nextMap);
    }, [selectedPo, selectedPoReceipts]);

    const updateLineInput = (lineId: string, field: 'acceptedQuantity' | 'rejectedQuantity' | 'notes', value: string) => {
        setLineInputs((prev) => ({
            ...prev,
            [lineId]: {
                ...(prev[lineId] ?? { acceptedQuantity: '0', rejectedQuantity: '0', notes: '' }),
                [field]: value,
            },
        }));
    };

    const currentLineInputs = lineInputs;

    const handleCreatePurchaseOrder = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!poForm.supplierPartyId) {
            push('error', 'Select an active supplier before creating a purchase order.');
            return;
        }

        const quantity = Number(poForm.lineQuantity);
        const rate = Number(poForm.lineRate);
        const taxAmount = Number(poForm.taxAmount || 0);
        if (!poForm.lineDescription.trim()) {
            push('error', 'At least one line description is required.');
            return;
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
            push('error', 'Line quantity must be greater than zero.');
            return;
        }
        if (!Number.isFinite(rate) || rate < 0) {
            push('error', 'Line rate must be zero or greater.');
            return;
        }
        if (!Number.isFinite(taxAmount) || taxAmount < 0) {
            push('error', 'Tax amount must be zero or greater.');
            return;
        }

        setPoSaving(true);
        const created = await createPurchaseOrder({
            projectId,
            supplierPartyId: poForm.supplierPartyId,
            poNumber: poForm.poNumber.trim() || undefined,
            orderDate: poForm.orderDate || undefined,
            expectedDeliveryDate: poForm.expectedDeliveryDate || null,
            taxAmount,
            notes: poForm.notes.trim() || null,
            lines: [
                {
                    description: poForm.lineDescription.trim(),
                    quantity,
                    unit: poForm.lineUnit.trim() || null,
                    rate,
                },
            ],
        });
        setPoSaving(false);

        if (!created) {
            push('error', 'Could not create purchase order right now. Please try again.');
            return;
        }

        push('success', 'Purchase order created successfully.');
        setPoModalOpen(false);
        setPoForm({
            supplierPartyId: '',
            poNumber: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
            orderDate: new Date().toISOString().slice(0, 10),
            expectedDeliveryDate: '',
            taxAmount: '0',
            notes: '',
            lineDescription: '',
            lineQuantity: '1',
            lineUnit: '',
            lineRate: '0',
        });
        await loadData();
        setSelectedPoId(created.id);
    };

    const handlePoStatusChange = async (status: 'approved' | 'closed') => {
        if (!selectedPo) return;
        setPoSaving(true);
        const updated = await updatePurchaseOrderStatus(selectedPo.id, status);
        setPoSaving(false);
        if (!updated) {
            push('error', 'Could not update purchase order status right now. Please try again.');
            return;
        }
        push('success', `Purchase order marked as ${status}.`);
        await loadData();
    };

    const handleCancelPo = async () => {
        if (!selectedPo) return;
        setPoSaving(true);
        const updated = await cancelPurchaseOrder(selectedPo.id);
        setPoSaving(false);
        if (!updated) {
            push('error', 'Could not cancel this purchase order right now. Please try again.');
            return;
        }
        push('success', 'Purchase order cancelled successfully.');
        await loadData();
    };

    const handleCreateReceipt = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedPo) {
            push('error', 'Select a purchase order before creating a material receipt.');
            return;
        }
        if (selectedPo.status === 'cancelled') {
            push('error', 'Cannot create a material receipt for a cancelled purchase order.');
            return;
        }

        const lines = selectedPo.lineItems.map((line) => {
            const input = currentLineInputs[line.id] ?? { acceptedQuantity: '0', rejectedQuantity: '0', notes: '' };
            const acceptedQuantity = Number(input.acceptedQuantity ?? 0);
            const rejectedQuantity = Number(input.rejectedQuantity ?? 0);
            return {
                purchaseOrderLineId: line.id,
                acceptedQuantity,
                rejectedQuantity,
                notes: input.notes?.trim() || null,
            };
        }).filter((line) => Number(line.acceptedQuantity ?? 0) > 0 || Number(line.rejectedQuantity ?? 0) > 0);

        if (lines.length === 0) {
            push('error', 'At least one line must include a positive accepted or rejected quantity.');
            return;
        }

        setSaving(true);
        const result = await createMaterialReceipt({
            projectId,
            purchaseOrderId: selectedPo.id,
            receiptNumber: form.receiptNumber.trim() || `MR-${Date.now()}`,
            receiptDate: form.receiptDate || new Date().toISOString().slice(0, 10),
            deliveryReferenceNumber: form.deliveryReferenceNumber.trim() || null,
            notes: form.notes.trim() || null,
            status: 'accepted',
            lines,
        });
        setSaving(false);

        if (!result) {
            push('error', 'Could not create the material receipt right now. Please try again.');
            return;
        }

        push('success', 'Material receipt created successfully.');
        setForm({ receiptNumber: `MR-${Date.now()}`, receiptDate: '', deliveryReferenceNumber: '', notes: '' });
        await loadData();
    };

    const handleDeleteReceipt = async () => {
        if (!deleteReceiptId) return;

        const ok = await deleteMaterialReceipt(deleteReceiptId);
        setDeleteReceiptId(null);
        if (!ok) {
            push('error', 'Could not delete this material receipt right now. Please try again.');
            return;
        }

        push('success', 'Material receipt deleted successfully.');
        await loadData();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading purchase orders and deliveries...</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <label className="block flex-1">
                    <span className={labelClass}>Purchase order</span>
                    <select className={inputClass} value={selectedPoId} onChange={(event) => setSelectedPoId(event.target.value)} disabled={purchaseOrders.length === 0}>
                        {purchaseOrders.length === 0 ? <option value="">No purchase orders yet</option> : null}
                        {purchaseOrders.map((po) => (
                            <option key={po.id} value={po.id}>{po.poNumber} • {po.supplierName || 'Supplier'}</option>
                        ))}
                    </select>
                </label>
                <div className="flex gap-2">
                    <AppButton variant="secondary" onClick={() => setPoModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Add PO
                    </AppButton>
                </div>
            </div>

            {purchaseOrders.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                    No purchase orders are available for this project yet. Create your first purchase order to start delivery tracking.
                </div>
            ) : null}

            {selectedPo && (
                <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-[#17243A]">{selectedPo.poNumber}</p>
                            <p className="text-xs text-[#667085]">{selectedPo.supplierName || 'Supplier'} • {selectedPo.status}</p>
                        </div>
                        <StatusPill label={selectedPo.status} tone={selectedPo.status === 'closed' ? 'success' : selectedPo.status === 'cancelled' ? 'warning' : 'info'} />
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-[#E6E8EC] bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Ordered</p>
                            <p className="mt-2 text-base font-semibold text-[#17243A]">{formatINR(selectedPo.totalAmount)}</p>
                        </div>
                        <div className="rounded-lg border border-[#E6E8EC] bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Lines</p>
                            <p className="mt-2 text-base font-semibold text-[#17243A]">{selectedPo.lineItems.length}</p>
                        </div>
                        <div className="rounded-lg border border-[#E6E8EC] bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Receipts</p>
                            <p className="mt-2 text-base font-semibold text-[#17243A]">{selectedPoReceipts.length}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedPo.status === 'draft' ? (
                            <AppButton variant="secondary" disabled={poSaving} onClick={() => void handlePoStatusChange('approved')}>
                                {poSaving ? 'Saving...' : 'Approve PO'}
                            </AppButton>
                        ) : null}
                        {selectedPo.status === 'approved' ? (
                            <AppButton variant="secondary" disabled={poSaving} onClick={() => void handlePoStatusChange('closed')}>
                                {poSaving ? 'Saving...' : 'Mark Closed'}
                            </AppButton>
                        ) : null}
                        {selectedPo.status !== 'cancelled' && selectedPo.status !== 'closed' ? (
                            <AppButton variant="danger" disabled={poSaving} onClick={() => void handleCancelPo()}>
                                {poSaving ? 'Saving...' : 'Cancel PO'}
                            </AppButton>
                        ) : null}
                    </div>
                </div>
            )}

            {selectedPo && (
                <form onSubmit={handleCreateReceipt} className="space-y-4 rounded-xl border border-[#E6E8EC] bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Receipt number" required>
                            <input className={inputClass} value={form.receiptNumber} onChange={(event) => setForm((prev) => ({ ...prev, receiptNumber: event.target.value }))} />
                        </Field>
                        <Field label="Receipt date" required>
                            <input type="date" className={inputClass} value={form.receiptDate || asInputDate(new Date().toISOString())} onChange={(event) => setForm((prev) => ({ ...prev, receiptDate: event.target.value }))} />
                        </Field>
                        <Field label="Delivery reference">
                            <input className={inputClass} value={form.deliveryReferenceNumber} onChange={(event) => setForm((prev) => ({ ...prev, deliveryReferenceNumber: event.target.value }))} />
                        </Field>
                    </div>

                    <Field label="Notes">
                        <textarea className={`${inputClass} min-h-[90px]`} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
                    </Field>

                    {selectedPo && (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-[#17243A]">Line acceptance</p>
                            {selectedPo.lineItems.map((line) => {
                                const previousAccepted = selectedPoReceipts.reduce((sum, receipt) => {
                                    const matching = receipt.lineItems.find((item) => item.purchaseOrderLineId === line.id);
                                    return sum + Number(matching?.acceptedQuantity ?? 0);
                                }, 0);
                                const remaining = Math.max(0, Number(line.quantity ?? 0) - previousAccepted);
                                const currentInput = currentLineInputs[line.id] ?? { acceptedQuantity: String(remaining), rejectedQuantity: '0', notes: '' };

                                return (
                                    <div key={line.id} className="rounded-xl border border-[#E6E8EC] p-3">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-[#17243A]">{line.description}</p>
                                                <p className="text-xs text-[#667085]">Ordered: {line.quantity} • Previously received: {previousAccepted} • Remaining: {remaining}</p>
                                            </div>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <Field label="Accepted qty">
                                                <input type="number" min="0" step="0.01" className={inputClass} value={currentInput.acceptedQuantity ?? '0'} onChange={(event) => updateLineInput(line.id, 'acceptedQuantity', event.target.value)} />
                                            </Field>
                                            <Field label="Rejected qty">
                                                <input type="number" min="0" step="0.01" className={inputClass} value={currentInput.rejectedQuantity ?? '0'} onChange={(event) => updateLineInput(line.id, 'rejectedQuantity', event.target.value)} />
                                            </Field>
                                            <Field label="Line note">
                                                <input className={inputClass} value={currentInput.notes ?? ''} onChange={(event) => updateLineInput(line.id, 'notes', event.target.value)} />
                                            </Field>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <AppButton type="submit" disabled={saving || selectedPo?.status === 'cancelled'}>
                            {saving ? 'Saving...' : selectedPo?.status === 'cancelled' ? 'PO Cancelled' : 'Create receipt'}
                        </AppButton>
                    </div>
                </form>
            )}

            {selectedPo && materialReceipts.length > 0 && (
                <div className="space-y-3 rounded-xl border border-[#E6E8EC] bg-white p-4">
                    <p className="text-sm font-semibold text-[#17243A]">Receipt history</p>
                    {materialReceipts.filter((receipt) => receipt.purchaseOrderId === (selectedPo?.id ?? '')).map((receipt) => (
                        <div key={receipt.id} className="rounded-xl border border-[#E6E8EC] p-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-medium text-[#17243A]">{receipt.receiptNumber}</p>
                                <div className="flex items-center gap-2">
                                    <StatusPill label={receipt.status} tone={receipt.status === 'accepted' ? 'success' : 'warning'} />
                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteReceiptId(receipt.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </AppButton>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-[#667085]">{receipt.receiptDate ? formatDate(receipt.receiptDate) : 'No date'} • {receipt.deliveryReferenceNumber || 'No delivery reference'}</p>
                            <div className="mt-2 space-y-2">
                                {receipt.lineItems.map((line) => (
                                    <div key={line.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-[#344054]">
                                        <span>{line.purchaseOrderLineDescription}</span>
                                        <span>Accepted {line.acceptedQuantity} / Rejected {line.rejectedQuantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {poModalOpen && (
                <Modal eyebrow="Purchase order" title="Create purchase order" onClose={() => setPoModalOpen(false)} size="lg">
                    <form onSubmit={handleCreatePurchaseOrder} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Supplier" required>
                                <select
                                    className={inputClass}
                                    value={poForm.supplierPartyId}
                                    onChange={(event) => setPoForm((prev) => ({ ...prev, supplierPartyId: event.target.value }))}
                                >
                                    <option value="">Select active supplier</option>
                                    {supplierContacts.map((party) => (
                                        <option key={party.id} value={party.id}>{party.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="PO number">
                                <input className={inputClass} value={poForm.poNumber} onChange={(event) => setPoForm((prev) => ({ ...prev, poNumber: event.target.value }))} />
                            </Field>
                            <Field label="Order date">
                                <input type="date" className={inputClass} value={poForm.orderDate} onChange={(event) => setPoForm((prev) => ({ ...prev, orderDate: event.target.value }))} />
                            </Field>
                            <Field label="Expected delivery">
                                <input type="date" className={inputClass} value={poForm.expectedDeliveryDate} onChange={(event) => setPoForm((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))} />
                            </Field>
                            <Field label="Tax amount">
                                <input type="number" min="0" step="0.01" className={inputClass} value={poForm.taxAmount} onChange={(event) => setPoForm((prev) => ({ ...prev, taxAmount: event.target.value }))} />
                            </Field>
                            <Field label="Notes">
                                <input className={inputClass} value={poForm.notes} onChange={(event) => setPoForm((prev) => ({ ...prev, notes: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="rounded-xl border border-[#E6E8EC] p-3">
                            <p className="mb-3 text-sm font-semibold text-[#17243A]">Line item</p>
                            <div className="grid gap-3 md:grid-cols-4">
                                <Field label="Description" required>
                                    <input className={inputClass} value={poForm.lineDescription} onChange={(event) => setPoForm((prev) => ({ ...prev, lineDescription: event.target.value }))} />
                                </Field>
                                <Field label="Quantity" required>
                                    <input type="number" min="0.01" step="0.01" className={inputClass} value={poForm.lineQuantity} onChange={(event) => setPoForm((prev) => ({ ...prev, lineQuantity: event.target.value }))} />
                                </Field>
                                <Field label="Unit">
                                    <input className={inputClass} value={poForm.lineUnit} onChange={(event) => setPoForm((prev) => ({ ...prev, lineUnit: event.target.value }))} />
                                </Field>
                                <Field label="Rate" required>
                                    <input type="number" min="0" step="0.01" className={inputClass} value={poForm.lineRate} onChange={(event) => setPoForm((prev) => ({ ...prev, lineRate: event.target.value }))} />
                                </Field>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setPoModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={poSaving}>{poSaving ? 'Saving...' : 'Create PO'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteReceiptId}
                title="Delete material receipt?"
                message="This will remove the selected receipt from delivery records and recalculate purchase order completion status."
                danger
                confirmLabel="Delete receipt"
                onConfirm={handleDeleteReceipt}
                onCancel={() => setDeleteReceiptId(null)}
            />
        </div>
    );
}

export function ProjectStagePanel({ projectId }: { projectId: string }) {
    const [stages, setStages] = useState<ProjectStageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectStageRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        sequenceNumber: '1',
        status: 'pending' as ProjectStageStatus,
        completionPercentage: '0',
        plannedStartDate: '',
        plannedEndDate: '',
    });
    const { push } = useToast();

    const loadStages = async () => {
        setLoading(true);
        setStages(await listProjectStages(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadStages();
    }, [projectId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', sequenceNumber: String(stages.length + 1), status: 'pending', completionPercentage: '0', plannedStartDate: '', plannedEndDate: '' });
        setModalOpen(true);
    };

    const openEdit = (stage: ProjectStageRecord) => {
        setEditing(stage);
        setForm({
            name: stage.name,
            sequenceNumber: String(stage.sequenceNumber),
            status: stage.status,
            completionPercentage: String(stage.completionPercentage),
            plannedStartDate: asInputDate(stage.plannedStartDate),
            plannedEndDate: asInputDate(stage.plannedEndDate),
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim()) {
            push('error', 'Stage name is required.');
            return;
        }
        const sequenceNumber = parseNumber(form.sequenceNumber);
        const completionPercentage = parseNumber(form.completionPercentage);
        if (!sequenceNumber || sequenceNumber <= 0) {
            push('error', 'Sequence number must be greater than 0.');
            return;
        }
        if (completionPercentage === null || completionPercentage < 0 || completionPercentage > 100) {
            push('error', 'Completion must be between 0 and 100.');
            return;
        }

        setSaving(true);
        const payload = {
            name: form.name.trim(),
            sequenceNumber,
            status: form.status,
            completionPercentage,
            plannedStartDate: form.plannedStartDate || null,
            plannedEndDate: form.plannedEndDate || null,
        };

        const result = editing
            ? await updateProjectStage(editing.id, payload)
            : await createProjectStage({ projectId, ...payload });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update this stage right now. Please try again.' : 'Could not create this stage right now. Please try again.');
            return;
        }

        push('success', editing ? 'Project stage updated successfully.' : 'Project stage created successfully.');
        setModalOpen(false);
        await loadStages();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectStage(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete this stage right now. Please try again.');
            return;
        }
        push('success', 'Project stage deleted successfully.');
        await loadStages();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading project stages...</div>;

    return (
        <>
            <PremiumCard className="p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Project stages</p>
                        <p className="mt-1 text-sm text-[#667085]">Track the project lifecycle across physical milestones.</p>
                    </div>
                    <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add stage</AppButton>
                </div>

                {stages.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<FolderKanban className="h-5 w-5" />} title="No stages created yet" description="Add project milestones as the work sequence is defined." /></div>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3">Stage</th>
                                    <th className="px-4 py-3">Start date</th>
                                    <th className="px-4 py-3">Expected completion</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Completion</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {stages.map((stage) => (
                                    <tr key={stage.id}>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{stage.name}</td>
                                        <td className="px-4 py-3 text-[#344054]">{stage.plannedStartDate ? formatDate(stage.plannedStartDate) : '-'}</td>
                                        <td className="px-4 py-3 text-[#344054]">{stage.plannedEndDate ? formatDate(stage.plannedEndDate) : '-'}</td>
                                        <td className="px-4 py-3"><StatusPill label={stageStatusLabelMap[stage.status] ?? stage.status} tone={stage.status === 'completed' ? 'success' : stage.status === 'in_progress' ? 'info' : stage.status === 'on_hold' ? 'warning' : 'neutral'} /></td>
                                        <td className="px-4 py-3 text-[#344054]">{stage.completionPercentage}%</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(stage)}><Pencil className="h-4 w-4" /></AppButton>
                                                <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(stage.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Stage" title={editing ? 'Edit stage' : 'Add stage'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Stage name" required>
                                <input className={inputClass} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                            </Field>
                            <Field label="Sequence" required>
                                <input type="number" min="1" className={inputClass} value={form.sequenceNumber} onChange={(event) => setForm((prev) => ({ ...prev, sequenceNumber: event.target.value }))} />
                            </Field>
                            <Field label="Status">
                                <select className={inputClass} value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ProjectStageStatus }))}>
                                    {stageStatuses.map((status) => <option key={status} value={status}>{stageStatusLabelMap[status]}</option>)}
                                </select>
                            </Field>
                            <Field label="Completion %" required>
                                <input type="number" min="0" max="100" className={inputClass} value={form.completionPercentage} onChange={(event) => setForm((prev) => ({ ...prev, completionPercentage: event.target.value }))} />
                            </Field>
                            <Field label="Planned start">
                                <input type="date" className={inputClass} value={form.plannedStartDate} onChange={(event) => setForm((prev) => ({ ...prev, plannedStartDate: event.target.value }))} />
                            </Field>
                            <Field label="Planned end">
                                <input type="date" className={inputClass} value={form.plannedEndDate} onChange={(event) => setForm((prev) => ({ ...prev, plannedEndDate: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add stage'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete stage?"
                message="This removes the selected stage from the project timeline."
                danger
                confirmLabel="Delete stage"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectProgressPanel({ projectId }: { projectId: string }) {
    const [updates, setUpdates] = useState<ProjectProgressUpdateRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectProgressUpdateRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        progressPercentage: '',
        visibilityStatus: 'draft' as ProjectProgressVisibility,
        updateDate: '',
    });
    const { push } = useToast();

    const loadUpdates = async () => {
        setLoading(true);
        setUpdates(await listProjectProgressUpdates(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadUpdates();
    }, [projectId]);

    const orderedUpdates = useMemo(() => {
        const asTime = (value?: string | null) => {
            if (!value) return 0;
            const parsed = new Date(value).getTime();
            return Number.isFinite(parsed) ? parsed : 0;
        };

        return [...updates].sort((a, b) => {
            const left = asTime(a.updateDate ?? a.updatedAt ?? a.createdAt ?? null);
            const right = asTime(b.updateDate ?? b.updatedAt ?? b.createdAt ?? null);
            return right - left;
        });
    }, [updates]);

    const openCreate = () => {
        setEditing(null);
        setForm({ title: '', description: '', progressPercentage: '', visibilityStatus: 'draft', updateDate: '' });
        setModalOpen(true);
    };

    const openEdit = (update: ProjectProgressUpdateRecord) => {
        setEditing(update);
        setForm({
            title: update.title,
            description: update.description || '',
            progressPercentage: update.progressPercentage !== null && update.progressPercentage !== undefined ? String(update.progressPercentage) : '',
            visibilityStatus: update.visibilityStatus,
            updateDate: asInputDate(update.updateDate),
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.title.trim()) {
            push('error', 'Title is required.');
            return;
        }
        const progressPercentage = parseOptionalNumber(form.progressPercentage);
        if (progressPercentage !== null && (progressPercentage < 0 || progressPercentage > 100)) {
            push('error', 'Progress must be between 0 and 100.');
            return;
        }

        setSaving(true);
        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            progressPercentage,
            visibilityStatus: form.visibilityStatus,
            updateDate: form.updateDate || null,
        };

        const result = editing
            ? await updateProjectProgressUpdate(editing.id, payload)
            : await createProjectProgressUpdate({ projectId, ...payload });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update this site update right now. Please try again.' : 'Could not create this site update right now. Please try again.');
            return;
        }

        push('success', editing ? 'Site update saved successfully.' : 'Site update created successfully.');
        setModalOpen(false);
        await loadUpdates();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectProgressUpdate(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete this site update right now. Please try again.');
            return;
        }
        push('success', 'Site update deleted successfully.');
        await loadUpdates();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading site updates...</div>;

    return (
        <>
            <PremiumCard className="p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Site updates</p>
                        <p className="mt-1 text-sm text-[#667085]">Recent progress reports and field observations.</p>
                    </div>
                    <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add update</AppButton>
                </div>

                {orderedUpdates.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<CalendarClock className="h-5 w-5" />} title="No site updates yet" description="Capture the latest status, delays, and milestone notes for the project." /></div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {orderedUpdates.map((update) => (
                            <div key={update.id} className="rounded-xl border border-[#E6E8EC] p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-semibold text-[#17243A]">{update.title}</p>
                                    <div className="flex items-center gap-2">
                                        <StatusPill label={update.visibilityStatus} tone={update.visibilityStatus === 'published' ? 'success' : 'neutral'} />
                                        <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(update)}><Pencil className="h-4 w-4" /></AppButton>
                                        <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(update.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-[#667085]">{update.description || 'No notes for this update.'}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#667085]">
                                    <span>{update.updateDate ? formatDate(update.updateDate) : 'Date pending'}</span>
                                    <span>{update.progressPercentage !== null && update.progressPercentage !== undefined ? `${update.progressPercentage}% progress` : 'Progress pending'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Site update" title={editing ? 'Edit site update' : 'Add site update'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Title" required>
                                <input className={inputClass} value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                            </Field>
                            <Field label="Progress %">
                                <input type="number" min="0" max="100" className={inputClass} value={form.progressPercentage} onChange={(event) => setForm((prev) => ({ ...prev, progressPercentage: event.target.value }))} />
                            </Field>
                            <Field label="Visibility">
                                <select className={inputClass} value={form.visibilityStatus} onChange={(event) => setForm((prev) => ({ ...prev, visibilityStatus: event.target.value as ProjectProgressVisibility }))}>
                                    {progressVisibilityStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <Field label="Update date">
                                <input type="date" className={inputClass} value={form.updateDate} onChange={(event) => setForm((prev) => ({ ...prev, updateDate: event.target.value }))} />
                            </Field>
                            <Field label="Description" >
                                <textarea className={`${inputClass} min-h-[96px]`} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add update'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete site update?"
                message="This removes the selected site update entry from the project timeline."
                danger
                confirmLabel="Delete site update"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectExpensePanel({ projectId, readOnly = false }: { projectId: string; readOnly?: boolean }) {
    const [expenses, setExpenses] = useState<ProjectExpenseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectExpenseRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        supplierName: '',
        category: 'General',
        description: 'Supplier expense',
        billAmount: '',
        status: 'unpaid' as ProjectExpenseStatus,
    });
    const { push } = useToast();

    const loadExpenses = async () => {
        setLoading(true);
        setExpenses(await listProjectExpenses(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadExpenses();
    }, [projectId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ supplierName: '', category: 'General', description: 'Supplier expense', billAmount: '', status: 'unpaid' });
        setModalOpen(true);
    };

    const openEdit = (expense: ProjectExpenseRecord) => {
        setEditing(expense);
        setForm({
            supplierName: expense.supplierName || '',
            category: expense.category || 'General',
            description: expense.description || '',
            billAmount: String(expense.billAmount ?? ''),
            status: expense.status,
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        const billAmount = parseNumber(form.billAmount);
        if (billAmount === null || billAmount <= 0) {
            push('error', 'Bill amount must be greater than 0.');
            return;
        }
        if (!form.category.trim()) {
            push('error', 'Category is required.');
            return;
        }

        setSaving(true);
        const payload = {
            supplierName: form.supplierName.trim() || null,
            category: form.category.trim(),
            description: form.description.trim() || 'Supplier expense',
            billAmount,
            status: form.status,
        };

        const result = editing
            ? await updateProjectExpense(editing.id, payload)
            : await createProjectExpense({ projectId, ...payload });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update this expense right now. Please try again.' : 'Could not create this expense right now. Please try again.');
            return;
        }
        push('success', editing ? 'Expense updated successfully.' : 'Expense created successfully.');
        setModalOpen(false);
        await loadExpenses();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectExpense(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete this expense right now. Please try again.');
            return;
        }
        push('success', 'Expense deleted successfully.');
        await loadExpenses();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading expenses...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Expenses</p>
                        <p className="mt-1 text-sm text-[#667085]">{readOnly ? 'Read-only view.' : 'Supplier bills and internal costs.'}</p>
                    </div>
                    {!readOnly && <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add expense</AppButton>}
                </div>

                {expenses.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<FileText className="h-5 w-5" />} title="No expenses logged" description="Keep the supplier bills and site expenses tracked against this project." /></div>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3">Supplier</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    {!readOnly && <th className="px-4 py-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{expense.supplierName || 'Unassigned'}</td>
                                        <td className="px-4 py-3 text-[#344054]">{expense.category || 'General'}</td>
                                        <td className="px-4 py-3 text-[#17243A]">{formatINR(Number(expense.billAmount ?? 0))}</td>
                                        <td className="px-4 py-3"><StatusPill label={expense.status} tone={expense.status === 'paid' ? 'success' : expense.status === 'partially_paid' ? 'info' : expense.status === 'void' ? 'warning' : 'neutral'} /></td>
                                        {!readOnly && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(expense)}><Pencil className="h-4 w-4" /></AppButton>
                                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(expense.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            {!readOnly && modalOpen && (
                <Modal eyebrow="Expense" title={editing ? 'Edit expense' : 'Add expense'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Supplier">
                                <input className={inputClass} value={form.supplierName} onChange={(event) => setForm((prev) => ({ ...prev, supplierName: event.target.value }))} />
                            </Field>
                            <Field label="Category" required>
                                <input className={inputClass} value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
                            </Field>
                            <Field label="Amount" required>
                                <input type="number" min="0" step="0.01" className={inputClass} value={form.billAmount} onChange={(event) => setForm((prev) => ({ ...prev, billAmount: event.target.value }))} />
                            </Field>
                            <Field label="Status">
                                <select className={inputClass} value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ProjectExpenseStatus }))}>
                                    {expenseStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <Field label="Description">
                                <textarea className={`${inputClass} min-h-[96px]`} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add expense'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!readOnly && !!deleteId}
                title="Delete expense?"
                message="This will remove the selected expense record from this project."
                danger
                confirmLabel="Delete expense"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectReceiptPanel({ projectId, customerMobile, projectName, readOnly = false }: { projectId: string; customerMobile?: string | null; projectName?: string; readOnly?: boolean }) {
    const [receipts, setReceipts] = useState<ProjectReceiptRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectReceiptRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        receiptNumber: '',
        amount: '',
        paymentMethod: 'cash' as ProjectReceiptPaymentMethod,
        receivedDate: '',
        referenceNumber: '',
        notes: '',
    });
    const { push } = useToast();

    const loadReceipts = async () => {
        setLoading(true);
        setReceipts(await listProjectReceipts(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadReceipts();
    }, [projectId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ receiptNumber: `RCP-${Date.now()}`, amount: '', paymentMethod: 'cash', receivedDate: '', referenceNumber: '', notes: '' });
        setModalOpen(true);
    };

    const openEdit = (receipt: ProjectReceiptRecord) => {
        setEditing(receipt);
        setForm({
            receiptNumber: receipt.receiptNumber,
            amount: String(receipt.amount ?? ''),
            paymentMethod: receipt.paymentMethod,
            receivedDate: asInputDate(receipt.receivedDate),
            referenceNumber: receipt.referenceNumber || '',
            notes: receipt.notes || '',
        });
        setModalOpen(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        const amount = parseNumber(form.amount);
        if (amount === null || amount <= 0) {
            push('error', 'Amount must be greater than 0.');
            return;
        }
        if (!form.receiptNumber.trim()) {
            push('error', 'Receipt number is required.');
            return;
        }

        setSaving(true);
        const payload = {
            receiptNumber: form.receiptNumber.trim(),
            amount,
            paymentMethod: form.paymentMethod,
            receivedDate: form.receivedDate || null,
            referenceNumber: form.referenceNumber.trim() || null,
            notes: form.notes.trim() || null,
        };

        const result = editing
            ? await updateProjectReceipt(editing.id, payload)
            : await createProjectReceipt({ projectId, ...payload });
        setSaving(false);

        if (!result) {
            push('error', editing ? 'Could not update this receipt right now. Please try again.' : 'Could not create this receipt right now. Please try again.');
            return;
        }

        push('success', editing ? 'Receipt updated successfully.' : 'Receipt created successfully.');
        setModalOpen(false);
        await loadReceipts();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectReceipt(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete this receipt right now. Please try again.');
            return;
        }
        push('success', 'Receipt deleted successfully.');
        await loadReceipts();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading payments received...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Payments received</p>
                        <p className="mt-1 text-sm text-[#667085]">{readOnly ? 'Read-only view.' : 'Customer receipts and payment references.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!readOnly && <AppButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add receipt</AppButton>}
                        {!readOnly && customerMobile ? (
                            <a href={`https://wa.me/${customerMobile}?text=${encodeURIComponent(`Project: ${projectName || 'Project'}\nPayment received summary\nTotal collected: ${formatINR(receipts.reduce((sum, item) => sum + Number(item.amount ?? 0), 0))}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                <MessageCircle className="h-4 w-4" /> Share summary
                            </a>
                        ) : null}
                    </div>
                </div>

                {receipts.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<CalendarClock className="h-5 w-5" />} title="No payments recorded" description="Add customer receipts for this project." /></div>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3">Receipt</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Method</th>
                                    <th className="px-4 py-3">Amount</th>
                                    {!readOnly && <th className="px-4 py-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {receipts.map((receipt) => (
                                    <tr key={receipt.id}>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{receipt.receiptNumber}</td>
                                        <td className="px-4 py-3 text-[#344054]">{receipt.receivedDate ? formatDate(receipt.receivedDate) : '-'}</td>
                                        <td className="px-4 py-3 text-[#344054]">{receipt.paymentMethod}</td>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{formatINR(Number(receipt.amount ?? 0))}</td>
                                        {!readOnly && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEdit(receipt)}><Pencil className="h-4 w-4" /></AppButton>
                                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(receipt.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            {!readOnly && modalOpen && (
                <Modal eyebrow="Receipt" title={editing ? 'Edit receipt' : 'Add receipt'} onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Receipt number" required>
                                <input className={inputClass} value={form.receiptNumber} onChange={(event) => setForm((prev) => ({ ...prev, receiptNumber: event.target.value }))} />
                            </Field>
                            <Field label="Amount" required>
                                <input type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
                            </Field>
                            <Field label="Payment method">
                                <select className={inputClass} value={form.paymentMethod} onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value as ProjectReceiptPaymentMethod }))}>
                                    {receiptMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                                </select>
                            </Field>
                            <Field label="Received date">
                                <input type="date" className={inputClass} value={form.receivedDate} onChange={(event) => setForm((prev) => ({ ...prev, receivedDate: event.target.value }))} />
                            </Field>
                            <Field label="Reference number">
                                <input className={inputClass} value={form.referenceNumber} onChange={(event) => setForm((prev) => ({ ...prev, referenceNumber: event.target.value }))} />
                            </Field>
                            <Field label="Notes">
                                <textarea className={`${inputClass} min-h-[96px]`} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add receipt'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!readOnly && !!deleteId}
                title="Delete receipt?"
                message="This will remove the selected receipt from project records."
                danger
                confirmLabel="Delete receipt"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectAttachmentsPanel({ projectId, canManage, project }: { projectId: string; canManage: boolean; project: ProjectRecord }) {
    const [items, setItems] = useState<ProjectAttachmentRecord[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [bookingReceipts, setBookingReceipts] = useState<FlatBilling[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ storagePath: '', originalFilename: '', mimeType: '' });
    const { company } = useCompany();
    const { push } = useToast();

    const loadAttachments = async () => {
        setLoading(true);
        const [attachments, quotationRows, bookingRows] = await Promise.all([
            listProjectAttachments(projectId),
            company?.companyId ? listDocuments(company.companyId) : Promise.resolve([]),
            company?.companyId ? listFlatBillings(company.companyId) : Promise.resolve([]),
        ]);
        setItems(attachments);
        setQuotations(quotationRows);
        setBookingReceipts(bookingRows);
        setLoading(false);
    };

    useEffect(() => {
        void loadAttachments();
    }, [projectId]);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.storagePath.trim()) {
            push('error', 'Document path is required.');
            return;
        }

        setSaving(true);
        const created = await createProjectAttachment({
            projectId,
            storagePath: form.storagePath.trim(),
            originalFilename: form.originalFilename.trim() || 'Document',
            mimeType: form.mimeType.trim() || null,
            visibilityStatus: 'internal',
        });
        setSaving(false);

        if (!created) {
            push('error', 'Could not add this document right now. Please try again.');
            return;
        }

        push('success', 'Document added successfully.');
        setModalOpen(false);
        setForm({ storagePath: '', originalFilename: '', mimeType: '' });
        await loadAttachments();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const ok = await deleteProjectAttachment(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete this document right now. Please try again.');
            return;
        }
        push('success', 'Document deleted successfully.');
        await loadAttachments();
    };

    const normalizedProjectName = project.name.trim().toLowerCase();
    const linkedQuotations = quotations
        .filter((row) => row.project?.name?.trim().toLowerCase() === normalizedProjectName)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    const isAttachmentInCategory = (item: ProjectAttachmentRecord, category: 'quotation' | 'booking' | 'agreement' | 'other') => {
        const text = `${item.originalFilename || ''} ${item.storagePath || ''}`.toLowerCase();
        const isQuotation = text.includes('quotation') || text.includes('quote');
        const isBooking = text.includes('booking') || text.includes('receipt');
        const isAgreement = text.includes('agreement') || text.includes('jda');
        if (category === 'quotation') return isQuotation;
        if (category === 'booking') return isBooking;
        if (category === 'agreement') return isAgreement;
        return !isQuotation && !isBooking && !isAgreement;
    };

    const quotationAttachments = items.filter((item) => isAttachmentInCategory(item, 'quotation'));
    const bookingAttachments = items.filter((item) => isAttachmentInCategory(item, 'booking'));
    const agreementAttachments = items.filter((item) => isAttachmentInCategory(item, 'agreement'));
    const otherAttachments = items.filter((item) => isAttachmentInCategory(item, 'other'));
    const recentBookingReceipts = [...bookingReceipts]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
        .slice(0, 5);
    const quotationCount = linkedQuotations.length + quotationAttachments.length;
    const bookingCount = recentBookingReceipts.length + bookingAttachments.length;
    const agreementCount = agreementAttachments.length;
    const otherCount = otherAttachments.length;

    const renderAttachmentRows = (rows: ProjectAttachmentRecord[], emptyMessage: string) => {
        if (rows.length === 0) {
            return <div className="mt-3 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-3 text-sm text-[#667085]">{emptyMessage}</div>;
        }

        return (
            <div className="mt-3 space-y-2">
                {rows.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#E6E8EC] p-3">
                        <div>
                            <p className="font-medium text-[#17243A]">{item.originalFilename || 'Document'}</p>
                            <p className="mt-1 text-xs text-[#667085]">{item.mimeType || 'file'} - {item.createdAt ? formatDate(item.createdAt) : 'Recent'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={item.storagePath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                                <Link2 className="h-4 w-4" /> Open
                            </a>
                            {canManage ? <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></AppButton> : null}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading documents...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Documents</p>
                        <p className="mt-1 text-sm text-[#667085]">Project-linked files and references.</p>
                    </div>
                    {canManage ? <AppButton variant="primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add document</AppButton> : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <a href="/quotations" className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5 text-sm font-medium text-[#1D4ED8] hover:bg-[#EFF6FF]">
                        Open quotations
                    </a>
                    <a href="/client-receipts" className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5 text-sm font-medium text-[#1D4ED8] hover:bg-[#EFF6FF]">
                        Open booking receipts
                    </a>
                </div>

                <div className="mt-5 rounded-xl border border-[#E6E8EC] p-4">
                    <p className="text-sm font-semibold text-[#17243A]">Quotations ({quotationCount})</p>
                    {linkedQuotations.length === 0 ? (
                        <div className="mt-3 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-3 text-sm text-[#667085]">No linked quotations yet.</div>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {linkedQuotations.slice(0, 5).map((quote) => (
                                <a key={quote.id} href={`/quotations/${quote.id}/edit`} className="flex items-center justify-between gap-3 rounded-xl border border-[#E6E8EC] p-3 hover:bg-slate-50">
                                    <div>
                                        <p className="text-sm font-medium text-[#17243A]">{quote.quotationNumber || 'Quotation'}</p>
                                        <p className="text-xs text-[#667085]">{quote.updatedAt ? formatDate(quote.updatedAt) : 'Recent'}</p>
                                    </div>
                                    <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#667085]">{quote.status}</span>
                                </a>
                            ))}
                        </div>
                    )}
                    {renderAttachmentRows(quotationAttachments, 'No quotation attachments yet.')}
                </div>

                <div className="mt-5 rounded-xl border border-[#E6E8EC] p-4">
                    <p className="text-sm font-semibold text-[#17243A]">Booking receipts ({bookingCount})</p>
                    {recentBookingReceipts.length === 0 ? (
                        <div className="mt-3 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-3 text-sm text-[#667085]">No booking receipts yet.</div>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {recentBookingReceipts.map((receipt) => (
                                <a key={receipt.id} href={`/client-receipts/${receipt.id}/edit`} className="flex items-center justify-between gap-3 rounded-xl border border-[#E6E8EC] p-3 hover:bg-slate-50">
                                    <div>
                                        <p className="text-sm font-medium text-[#17243A]">{receipt.receiptNumber || 'Receipt'}</p>
                                        <p className="text-xs text-[#667085]">{receipt.updatedAt ? formatDate(receipt.updatedAt) : 'Recent'}</p>
                                    </div>
                                    <span className="text-xs text-[#667085]">{receipt.buyerName || 'Buyer pending'}</span>
                                </a>
                            ))}
                        </div>
                    )}
                    {renderAttachmentRows(bookingAttachments, 'No booking receipt attachments yet.')}
                </div>

                <div className="mt-5 rounded-xl border border-[#E6E8EC] p-4">
                    <p className="text-sm font-semibold text-[#17243A]">Agreements ({agreementCount})</p>
                    {project.businessModel === 'property_development' && project.developmentArrangement === 'joint_development' ? (
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667085]">JDA reference</p>
                                <p className="mt-1 text-sm text-[#17243A]">{project.jdaAgreementReference || 'N/A'}</p>
                            </div>
                            <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667085]">JDA date</p>
                                <p className="mt-1 text-sm text-[#17243A]">{project.jdaAgreementDate ? formatDate(project.jdaAgreementDate) : 'N/A'}</p>
                            </div>
                            <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2.5 md:col-span-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667085]">JDA document</p>
                                {project.jdaAgreementDocumentUrl ? (
                                    <a href={project.jdaAgreementDocumentUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#1D4ED8] hover:underline">
                                        Open JDA document
                                        <Link2 className="h-3.5 w-3.5" />
                                    </a>
                                ) : (
                                    <p className="mt-1 text-sm text-[#17243A]">N/A</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-3 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-3 text-sm text-[#667085]">No JDA agreement details for this project type.</div>
                    )}
                    {renderAttachmentRows(agreementAttachments, 'No agreement attachments yet.')}
                </div>

                <div className="mt-5 rounded-xl border border-[#E6E8EC] p-4">
                    <p className="text-sm font-semibold text-[#17243A]">Other attachments ({otherCount})</p>
                    {renderAttachmentRows(otherAttachments, 'No other attachments yet.')}
                </div>

                {items.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<FileText className="h-5 w-5" />} title="No project attachments yet" description="Add drawings, permits, or supporting files." /></div>
                ) : null}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Document" title="Add document" onClose={() => setModalOpen(false)} size="lg">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid gap-3">
                            <Field label="Document URL or storage path" required>
                                <input className={inputClass} value={form.storagePath} onChange={(event) => setForm((prev) => ({ ...prev, storagePath: event.target.value }))} />
                            </Field>
                            <Field label="File name">
                                <input className={inputClass} value={form.originalFilename} onChange={(event) => setForm((prev) => ({ ...prev, originalFilename: event.target.value }))} />
                            </Field>
                            <Field label="Mime type">
                                <input className={inputClass} value={form.mimeType} onChange={(event) => setForm((prev) => ({ ...prev, mimeType: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add document'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Delete document?"
                message="This will remove the selected document from the project."
                danger
                confirmLabel="Delete document"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectClientAccessPanel({ projectId }: { projectId: string }) {
    const [accessRows, setAccessRows] = useState<ProjectClientAccessRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [availableContacts, setAvailableContacts] = useState<PartyRecord[]>([]);
    const [selectedContactId, setSelectedContactId] = useState('');
    const [selectedContactEmail, setSelectedContactEmail] = useState('');
    const { push } = useToast();

    const loadAccess = async () => {
        setLoading(true);
        setAccessRows(await listProjectClientAccess(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadAccess();
    }, [projectId]);

    useEffect(() => {
        if (!modalOpen) return;

        let active = true;
        const loadCustomerContacts = async () => {
            const contacts = await listParties(undefined, 'customer', '', { activeOnly: true });
            if (!active) return;
            setAvailableContacts(contacts.filter((party) => party.isCustomer && party.isActive));
        };

        void loadCustomerContacts();
        return () => {
            active = false;
        };
    }, [modalOpen]);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        const email = selectedContactEmail.trim();
        if (!selectedContactId && !email) {
            push('error', 'Select an existing customer first.');
            return;
        }

        setSaving(true);
        const created = await createProjectClientAccessResult({ projectId, email });
        setSaving(false);

        if (!created.ok) {
            if (created.status === 404) {
                push('error', 'No user account exists for that client. Invite or create the account first, then grant project access.');
            } else {
                push('error', created.error || 'Could not grant customer access right now. Please try again.');
            }
            return;
        }

        push('success', 'Customer access granted successfully.');
        setSelectedContactId('');
        setSelectedContactEmail('');
        setModalOpen(false);
        await loadAccess();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await revokeProjectClientAccessResult(deleteId);
        setDeleteId(null);
        if (!result.ok) {
            push('error', result.error || 'Could not revoke customer access right now. Please try again.');
            return;
        }
        push('success', 'Customer access revoked successfully.');
        await loadAccess();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading client access...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Customer access</p>
                        <p className="mt-1 text-sm text-[#667085]">Who has access to project updates and shared financial visibility.</p>
                    </div>
                    <AppButton variant="primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Grant access</AppButton>
                </div>
                {accessRows.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<Users className="h-5 w-5" />} title="No customer access entries" description="Grant project visibility to relevant customer contacts when needed." /></div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {accessRows.map((row) => (
                            <div key={row.id} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-[#17243A]">{row.email}</p>
                                    <p className="text-xs text-[#667085]">Invited {row.invitedAt ? formatDate(row.invitedAt) : 'recently'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusPill label={row.invitationStatus} tone={row.invitationStatus === 'accepted' ? 'success' : row.invitationStatus === 'pending' ? 'info' : 'warning'} />
                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(row.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Customer access" title="Grant customer access" onClose={() => setModalOpen(false)} size="md">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Field label="Customer" required>
                            <select
                                className={inputClass}
                                value={selectedContactId}
                                onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setSelectedContactId(nextValue);
                                    const selectedParty = availableContacts.find((party) => party.id === nextValue);
                                    setSelectedContactEmail(selectedParty?.email ?? '');
                                }}
                            >
                                <option value="">Select an existing customer</option>
                                {availableContacts.map((party) => (
                                    <option key={party.id} value={party.id}>{party.name} {party.email ? `- ${party.email}` : ''}</option>
                                ))}
                            </select>
                        </Field>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <span className="font-medium">Email:</span> {selectedContactEmail || 'No customer selected'}
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            The customer must already have an application account. If not, invite or create the user account first.
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving || !selectedContactId}>{saving ? 'Saving...' : 'Grant access'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Revoke customer access?"
                message="This will revoke selected customer access to project updates."
                danger
                confirmLabel="Revoke customer access"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectInventoryPanel({ project }: { project: ProjectRecord }) {
    const [units, setUnits] = useState<ProjectUnitRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterShare, setFilterShare] = useState<'all' | 'builder' | 'landowner'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'allocated' | 'booked'>('all');
    const [form, setForm] = useState({ flatNo: '', floor: '', blockTower: '', shareType: 'builder' as 'builder' | 'landowner', status: 'available' as 'available' | 'allocated' });
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const loadUnits = async () => {
        setLoading(true);
        setError(null);
        try {
            const { units: nextUnits } = await listProjectUnits(project.id);
            setUnits(nextUnits);
        } catch (err) {
            console.error(err);
            setError('Could not load project inventory.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadUnits();
    }, [project.id]);

    const filteredUnits = useMemo(() => units.filter((unit) => {
        if (filterShare !== 'all' && unit.shareType !== filterShare) return false;
        if (filterStatus !== 'all' && unit.status !== filterStatus) return false;
        return true;
    }), [filterShare, filterStatus, units]);

    const totalProjectFlats = Number(project.totalProjectFlats ?? 0);
    const builderTarget = Number(project.builderShareUnits ?? 0);
    const landownerTarget = Number(project.landownerShareUnits ?? 0);
    const builderCount = units.filter((unit) => unit.shareType === 'builder').length;
    const landownerCount = units.filter((unit) => unit.shareType === 'landowner').length;
    const registeredCount = units.length;
    const availableCount = units.filter((unit) => unit.status === 'available').length;
    const allocatedCount = units.filter((unit) => unit.status === 'allocated').length;
    const bookedCount = units.filter((unit) => unit.status === 'booked').length;
    const completionPercent = totalProjectFlats > 0 ? Math.min(100, Math.round((registeredCount / totalProjectFlats) * 100)) : 0;

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.flatNo.trim()) {
            setError('Flat number is required.');
            return;
        }

        setSaving(true);
        const created = await createProjectUnit(project.id, {
            flatNo: form.flatNo.trim(),
            floor: form.floor.trim() ? Number(form.floor) : null,
            blockTower: form.blockTower.trim() || null,
            shareType: form.shareType,
            status: form.status,
        });
        setSaving(false);

        if (!created) {
            setError('Could not save this flat. Please check the project allocation counts and try again.');
            return;
        }

        setForm({ flatNo: '', floor: '', blockTower: '', shareType: 'builder', status: 'available' });
        await loadUnits();
    };

    const handleEdit = async (unit: ProjectUnitRecord) => {
        if (editingId && editingId !== unit.id) return;
        setError(null);
        setEditingId(unit.id);
        try {
            const updated = await updateProjectUnit(project.id, unit.id, {
                flatNo: unit.flatNo,
                floor: unit.floor,
                blockTower: unit.blockTower,
                shareType: unit.shareType,
                status: unit.status,
            });
            if (!updated) {
                setError('This change would create an inconsistent allocation. Please review the counts and try again.');
                return;
            }
            await loadUnits();
        } finally {
            setEditingId(null);
        }
    };

    const handleDelete = async (unitId: string) => {
        const removed = await deleteProjectUnit(project.id, unitId);
        if (!removed) {
            setError('This unit cannot be removed while it is allocated or booked.');
            return;
        }
        await loadUnits();
    };

    if (project.businessModel === 'material_supply') {
        return (
            <div className="space-y-4">
                <PremiumCard className="p-4">
                    <p className="text-base font-semibold text-[#17243A]">Material and delivery inventory</p>
                    <p className="mt-1 text-sm text-[#667085]">Purchase-order and delivery tracking.</p>
                </PremiumCard>
                <ProjectMaterialReceiptPanel projectId={project.id} />
            </div>
        );
    }

    if (project.businessModel !== 'property_development') {
        return (
            <PremiumCard className="p-5">
                <p className="text-base font-semibold text-[#17243A]">Inventory</p>
                <p className="mt-2 text-sm text-[#667085]">Inventory tracking is available only for property development projects.</p>
            </PremiumCard>
        );
    }

    return (
        <div className="space-y-4">
            <PremiumCard className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Project flat inventory</p>
                        <p className="mt-1 text-sm text-[#667085]">Track flat allocation counts.</p>
                    </div>
                    <div className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-medium text-[#1D4ED8]">
                        {completionPercent}% complete
                    </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    {[
                        { label: 'Total flats', value: totalProjectFlats || 0 },
                        { label: 'Builder share', value: builderTarget },
                        ...(project.developmentArrangement === 'joint_development' ? [{ label: 'Landowner share', value: landownerTarget }] : []),
                        { label: 'Available units', value: availableCount },
                        { label: 'Allocated units', value: allocatedCount },
                        { label: 'Booked units', value: bookedCount },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-[#E6E8EC] bg-slate-50 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667085]">{item.label}</p>
                            <p className="mt-2 text-lg font-semibold text-[#17243A]">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#1D4ED8]" style={{ width: `${completionPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-[#667085]">
                    Builder share: {builderCount}/{builderTarget}
                    {project.developmentArrangement === 'joint_development' ? ` • Landowner share: ${landownerCount}/${landownerTarget}` : ''}
                </p>
            </PremiumCard>

            <PremiumCard className="p-4">
                <p className="text-base font-semibold text-[#17243A]">Add flat</p>
                <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <label className="block xl:col-span-2">
                        <span className={labelClass}>Flat number</span>
                        <input value={form.flatNo} onChange={(event) => setForm((prev) => ({ ...prev, flatNo: event.target.value }))} className={inputClass} placeholder="A-101" />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Floor</span>
                        <input type="number" value={form.floor} onChange={(event) => setForm((prev) => ({ ...prev, floor: event.target.value }))} className={inputClass} placeholder="10" />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Tower</span>
                        <input value={form.blockTower} onChange={(event) => setForm((prev) => ({ ...prev, blockTower: event.target.value }))} className={inputClass} placeholder="Tower A" />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Share</span>
                        <select value={form.shareType} onChange={(event) => setForm((prev) => ({ ...prev, shareType: event.target.value as 'builder' | 'landowner' }))} className={inputClass}>
                            <option value="builder">Builder</option>
                            {project.developmentArrangement === 'joint_development' ? <option value="landowner">Landowner</option> : null}
                        </select>
                    </label>
                    <label className="block">
                        <span className={labelClass}>Status</span>
                        <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as 'available' | 'allocated' }))} className={inputClass}>
                            <option value="available">Available</option>
                            <option value="allocated">Allocated</option>
                        </select>
                    </label>
                    <div className="flex items-end xl:col-span-1">
                        <AppButton type="submit" loading={saving} className="w-full">Add flat</AppButton>
                    </div>
                </form>

                {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            </PremiumCard>

            <PremiumCard className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-base font-semibold text-[#17243A]">Unit list</p>
                    <div className="flex flex-wrap gap-2">
                        <select value={filterShare} onChange={(event) => setFilterShare(event.target.value as 'all' | 'builder' | 'landowner')} className={inputClass}>
                            <option value="all">All allocations</option>
                            <option value="builder">Builder</option>
                            <option value="landowner">Landowner</option>
                        </select>
                        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as 'all' | 'available' | 'allocated' | 'booked')} className={inputClass}>
                            <option value="all">All statuses</option>
                            <option value="available">Available</option>
                            <option value="allocated">Allocated</option>
                            <option value="booked">Booked</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="mt-4 space-y-2">
                        {[0, 1, 2].map((item) => <SkeletonRow key={item} className="h-12 w-full" />)}
                    </div>
                ) : filteredUnits.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-4 text-sm text-[#667085]">No units match the current filter.</div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {filteredUnits.map((unit) => (
                            <div key={unit.id} className="rounded-xl border border-[#E6E8EC] bg-white p-3">
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                                    <label className="block xl:col-span-2">
                                        <span className={labelClass}>Flat</span>
                                        <input value={unit.flatNo} onChange={(event) => setUnits((current) => current.map((row) => row.id === unit.id ? { ...row, flatNo: event.target.value } : row))} className={inputClass} />
                                    </label>
                                    <label className="block">
                                        <span className={labelClass}>Floor</span>
                                        <input type="number" value={unit.floor ?? ''} onChange={(event) => setUnits((current) => current.map((row) => row.id === unit.id ? { ...row, floor: event.target.value === '' ? null : Number(event.target.value) } : row))} className={inputClass} />
                                    </label>
                                    <label className="block">
                                        <span className={labelClass}>Tower</span>
                                        <input value={unit.blockTower ?? ''} onChange={(event) => setUnits((current) => current.map((row) => row.id === unit.id ? { ...row, blockTower: event.target.value || null } : row))} className={inputClass} />
                                    </label>
                                    <label className="block">
                                        <span className={labelClass}>Share</span>
                                        <select value={unit.shareType} onChange={(event) => setUnits((current) => current.map((row) => row.id === unit.id ? { ...row, shareType: event.target.value as 'builder' | 'landowner' } : row))} className={inputClass}>
                                            <option value="builder">Builder</option>
                                            {project.developmentArrangement === 'joint_development' ? <option value="landowner">Landowner</option> : null}
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className={labelClass}>Status</span>
                                        <select
                                            value={unit.status === 'booked' ? 'allocated' : unit.status}
                                            onChange={(event) => setUnits((current) => current.map((row) => row.id === unit.id ? { ...row, status: event.target.value as 'available' | 'allocated' } : row))}
                                            className={inputClass}
                                            disabled={unit.status === 'booked'}
                                        >
                                            <option value="available">Available</option>
                                            <option value="allocated">Allocated</option>
                                        </select>
                                    </label>
                                </div>
                                {project.developmentArrangement === 'joint_development' && unit.shareType === 'landowner' ? (
                                    <p className="mt-2 text-xs text-[#667085]">Landowner units are tracked separately from builder booking workflows.</p>
                                ) : null}
                                {unit.status === 'booked' ? (
                                    <p className="mt-2 text-xs text-[#667085]">Booked status is controlled by booking workflows and cannot be changed here.</p>
                                ) : null}
                                <div className="mt-3 flex justify-end gap-2">
                                    <AppButton variant="secondary" onClick={() => void handleEdit(unit)} disabled={!!editingId}>{editingId === unit.id ? 'Saving...' : 'Save'} </AppButton>
                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => void handleDelete(unit.id)} disabled={!!editingId}><Trash2 className="h-4 w-4" /></AppButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>
        </div>
    );
}

export function ProjectPeoplePanel({ projectId }: { projectId: string }) {
    const [clientAccessRows, setClientAccessRows] = useState<ProjectClientAccessRecord[]>([]);
    const [investorRows, setInvestorRows] = useState<ProjectInvestorRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            const [customerAccess, investors] = await Promise.all([
                listProjectClientAccess(projectId),
                listProjectInvestors(projectId),
            ]);

            if (!active) return;
            setClientAccessRows(customerAccess);
            setInvestorRows(investors.filter((row) => row.isActive));
            setLoading(false);
        };

        void load();
        return () => {
            active = false;
        };
    }, [projectId]);

    const accessList = [
        ...clientAccessRows.filter((row) => row.invitationStatus === 'accepted').map((row) => ({
            key: `client-${row.id}`,
            label: row.email,
            subLabel: 'Customer access',
            tone: 'info' as const,
        })),
        ...investorRows.map((row) => ({
            key: `investor-${row.id}`,
            label: row.name || row.email || 'Investor',
            subLabel: row.email || 'No email linked',
            tone: 'success' as const,
        })),
    ];

    if (loading) {
        return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading project people…</div>;
    }

    return (
        <div className="space-y-6">
            <PremiumCard className="p-5">
                <p className="text-base font-semibold text-[#17243A]">Project team</p>
                <p className="mt-1 text-sm text-[#667085]">Internal team members are managed from the Team page.</p>
                <div className="mt-4 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-4 text-sm text-[#667085]">
                    Team access is managed separately from project details and is not handled here.
                </div>
            </PremiumCard>

            <PremiumCard className="p-5">
                <p className="text-base font-semibold text-[#17243A]">Customer access</p>
                <p className="mt-1 text-sm text-[#667085]">People who can view project updates and project visibility for the customer side.</p>

                {clientAccessRows.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-4 text-sm text-[#667085]">No customer access assigned yet.</div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {clientAccessRows.map((row) => (
                            <div key={row.id} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] bg-white px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-[#17243A]">{row.email}</p>
                                    <p className="text-xs text-[#667085]">Status: {row.invitationStatus}</p>
                                </div>
                                <StatusPill label={row.invitationStatus} tone={row.invitationStatus === 'accepted' ? 'success' : row.invitationStatus === 'pending' ? 'info' : 'warning'} />
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>

            <PremiumCard className="p-5">
                <p className="text-base font-semibold text-[#17243A]">Investor access</p>
                <p className="mt-1 text-sm text-[#667085]">Investors currently linked to this project and with active visibility.</p>

                {investorRows.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-4 text-sm text-[#667085]">No active investor access for this project.</div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {investorRows.map((row) => (
                            <div key={row.id} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] bg-white px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-[#17243A]">{row.name || row.email || 'Investor'}</p>
                                    <p className="text-xs text-[#667085]">{row.email || 'No email linked'}</p>
                                </div>
                                <StatusPill label="Active" tone="success" />
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>

            <PremiumCard className="p-5">
                <p className="text-base font-semibold text-[#17243A]">Access list</p>
                <p className="mt-1 text-sm text-[#667085]">People currently receiving project visibility.</p>

                {accessList.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-[#D0D5DD] bg-slate-50 p-4 text-sm text-[#667085]">No people currently have project visibility.</div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {accessList.map((person) => (
                            <div key={person.key} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] bg-white px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-[#17243A]">{person.label}</p>
                                    <p className="text-xs text-[#667085]">{person.subLabel}</p>
                                </div>
                                <StatusPill label={person.tone === 'success' ? 'Investor' : 'Customer'} tone={person.tone} />
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>
        </div>
    );
}

export function ProjectInvestorAccessPanel({ projectId }: { projectId: string }) {
    const [rows, setRows] = useState<ProjectInvestorRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [availableContacts, setAvailableContacts] = useState<PartyRecord[]>([]);
    const [selectedContactId, setSelectedContactId] = useState('');
    const [selectedContactEmail, setSelectedContactEmail] = useState('');
    const [selectedContactName, setSelectedContactName] = useState('');
    const { push } = useToast();

    const loadRows = async () => {
        setLoading(true);
        setRows(await listProjectInvestors(projectId));
        setLoading(false);
    };

    useEffect(() => {
        void loadRows();
    }, [projectId]);

    useEffect(() => {
        if (!modalOpen) return;

        let active = true;
        const loadInvestorContacts = async () => {
            const contacts = await listParties(undefined, 'investor', '', { activeOnly: true });
            if (!active) return;
            setAvailableContacts(contacts.filter((party) => party.isInvestor && party.isActive));
        };

        void loadInvestorContacts();
        return () => {
            active = false;
        };
    }, [modalOpen]);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        const name = selectedContactName.trim();
        const email = selectedContactEmail.trim();
        if (!selectedContactId || !name) {
            push('error', 'Select an existing investor first.');
            return;
        }

        setSaving(true);
        const created = await createProjectInvestorResult({
            projectId,
            userId: null,
            partyId: selectedContactId,
            name,
            email: email || null,
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

        push('success', 'Investor access granted successfully.');
        setSelectedContactId('');
        setSelectedContactEmail('');
        setSelectedContactName('');
        setModalOpen(false);
        await loadRows();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await deleteProjectInvestorResult(deleteId);
        setDeleteId(null);
        if (!result.ok) {
            push('error', result.error || 'Could not revoke investor access right now. Please try again.');
            return;
        }
        push('success', 'Investor access revoked successfully.');
        await loadRows();
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading investor access...</div>;

    return (
        <>
            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Investor access</p>
                        <p className="mt-1 text-sm text-[#667085]">Who can view project progress, milestones, and assigned funding information.</p>
                    </div>
                    <AppButton variant="primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Grant access</AppButton>
                </div>
                {rows.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<Users className="h-5 w-5" />} title="No investor access entries" description="Grant project visibility to relevant investor contacts once their account exists." /></div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {rows.filter((row) => row.isActive).map((row) => (
                            <div key={row.id} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-[#17243A]">{row.name}</p>
                                    <p className="text-xs text-[#667085]">{row.email || 'No email linked'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusPill label={row.isActive ? 'Active' : 'Revoked'} tone={row.isActive ? 'success' : 'warning'} />
                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(row.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>

            {modalOpen && (
                <Modal eyebrow="Investor access" title="Grant investor access" onClose={() => setModalOpen(false)} size="md">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Field label="Investor" required>
                            <select
                                className={inputClass}
                                value={selectedContactId}
                                onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setSelectedContactId(nextValue);
                                    const selectedParty = availableContacts.find((party) => party.id === nextValue);
                                    setSelectedContactName(selectedParty?.name ?? '');
                                    setSelectedContactEmail(selectedParty?.email ?? '');
                                }}
                            >
                                <option value="">Select an existing investor</option>
                                {availableContacts.map((party) => (
                                    <option key={party.id} value={party.id}>{party.name} {party.email ? `- ${party.email}` : ''}</option>
                                ))}
                            </select>
                        </Field>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <span className="font-medium">Name:</span> {selectedContactName || 'No investor selected'}
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <span className="font-medium">Email:</span> {selectedContactEmail || 'No investor selected'}
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            The investor must already have an application account. If not, invite or create the user account first.
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={saving || !selectedContactId}>{saving ? 'Saving...' : 'Grant access'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={!!deleteId}
                title="Revoke investor access?"
                message="This removes project access while preserving the investor record and funding history."
                danger
                confirmLabel="Revoke investor access"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
}

export function ProjectInvestorsPanel({ projectId }: { projectId: string }) {
    const { company } = useCompany();
    const canManageInvestors = company?.callerRole === 'owner' || company?.callerRole === 'admin';
    const [investors, setInvestors] = useState<ProjectInvestorRecord[]>([]);
    const [selectedInvestorId, setSelectedInvestorId] = useState('');
    const [contributions, setContributions] = useState<InvestorContributionRecord[]>([]);
    const [contributionModalOpen, setContributionModalOpen] = useState(false);
    const [editingContribution, setEditingContribution] = useState<InvestorContributionRecord | null>(null);
    const [deleteContributionId, setDeleteContributionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    const [editingTermsInvestor, setEditingTermsInvestor] = useState<ProjectInvestorRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [savingLink, setSavingLink] = useState(false);
    const [savingTerms, setSavingTerms] = useState(false);
    const [savingContribution, setSavingContribution] = useState(false);
    const [availableInvestorContacts, setAvailableInvestorContacts] = useState<PartyRecord[]>([]);
    const [selectedContactId, setSelectedContactId] = useState('');
    const [contactSearch, setContactSearch] = useState('');
    const [linkForm, setLinkForm] = useState({
        investmentPercentage: '',
    });
    const [termsForm, setTermsForm] = useState({
        investmentPercentage: '',
        isActive: true,
    });
    const [projectContractValue, setProjectContractValue] = useState(0);
    const [contributionTotalsByInvestorId, setContributionTotalsByInvestorId] = useState<Record<string, number>>({});
    const [contributionForm, setContributionForm] = useState({
        investorId: '',
        amount: '',
        contributionDate: '',
        referenceNumber: '',
        notes: '',
    });
    const { push } = useToast();

    const refreshContributionTotals = async (rows: ProjectInvestorRecord[]) => {
        if (!rows.length) {
            setContributionTotalsByInvestorId({});
            return;
        }

        const totals = await Promise.all(rows.map(async (investor) => {
            const records = await listInvestorContributions(investor.id);
            return [
                investor.id,
                records.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
            ] as const;
        }));

        setContributionTotalsByInvestorId(
            totals.reduce<Record<string, number>>((acc, [investorId, amount]) => {
                acc[investorId] = amount;
                return acc;
            }, {}),
        );
    };

    const loadInvestors = async () => {
        setLoading(true);
        try {
            const [rows, project] = await Promise.all([
                listProjectInvestors(projectId),
                getProject(projectId),
            ]);

            setInvestors(rows);
            setProjectContractValue(Number(project?.contractAmount ?? 0));
            setSelectedInvestorId((prev) => {
                if (prev && rows.some((item) => item.id === prev)) return prev;
                return rows[0]?.id ?? '';
            });
            await refreshContributionTotals(rows);
        } finally {
            setLoading(false);
        }
    };

    const loadContributions = async (investorId: string) => {
        if (!investorId) {
            setContributions([]);
            return;
        }
        setContributions(await listInvestorContributions(investorId));
    };

    useEffect(() => {
        void loadInvestors();
    }, [projectId]);

    useEffect(() => {
        void loadContributions(selectedInvestorId);
    }, [selectedInvestorId]);

    useEffect(() => {
        if (!linkModalOpen) return;

        let active = true;
        const loadInvestorContacts = async () => {
            const contacts = await listParties(undefined, 'investor', '', { activeOnly: true });
            if (!active) return;
            setAvailableInvestorContacts(contacts.filter((party) => party.isInvestor && party.isActive));
        };

        void loadInvestorContacts();
        return () => {
            active = false;
        };
    }, [linkModalOpen]);

    const filteredInvestorContacts = useMemo(() => {
        const term = contactSearch.trim().toLowerCase();
        return availableInvestorContacts.filter((party) => {
            if (!term) return true;
            return (
                party.name.toLowerCase().includes(term) ||
                (party.email ?? '').toLowerCase().includes(term) ||
                (party.mobile ?? '').toLowerCase().includes(term)
            );
        });
    }, [availableInvestorContacts, contactSearch]);

    const linkedPartyIds = useMemo(
        () => new Set(investors.map((investor) => investor.partyId).filter((id): id is string => Boolean(id))),
        [investors],
    );

    const linkableInvestorContacts = useMemo(
        () => filteredInvestorContacts.filter((party) => !linkedPartyIds.has(party.id)),
        [filteredInvestorContacts, linkedPartyIds],
    );

    const openLinkInvestor = () => {
        if (!canManageInvestors) {
            push('error', 'You do not have permission to link investors.');
            return;
        }
        setSelectedContactId('');
        setContactSearch('');
        setLinkForm({ investmentPercentage: '' });
        setLinkModalOpen(true);
    };

    const openEditTerms = (investor: ProjectInvestorRecord) => {
        if (!canManageInvestors) {
            push('error', 'You do not have permission to edit project investor terms.');
            return;
        }
        setEditingTermsInvestor(investor);
        setTermsForm({
            investmentPercentage: investor.investmentPercentage !== null && investor.investmentPercentage !== undefined ? String(investor.investmentPercentage) : '',
            isActive: investor.isActive,
        });
        setTermsModalOpen(true);
    };

    const handleLinkInvestor = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canManageInvestors) {
            push('error', 'You do not have permission to link investors.');
            return;
        }
        if (!selectedContactId) {
            push('error', 'Select an existing investor from the Investors page.');
            return;
        }

        if (linkedPartyIds.has(selectedContactId)) {
            push('error', 'This investor contact is already attached to this project.');
            return;
        }

        const selectedInvestorContact = availableInvestorContacts.find((party) => party.id === selectedContactId);
        if (!selectedInvestorContact) {
            push('error', 'The selected investor contact is no longer available.');
            return;
        }

        const investmentPercentage = parseOptionalNumber(linkForm.investmentPercentage);
        if (investmentPercentage !== null && (investmentPercentage < 0 || investmentPercentage > 100)) {
            push('error', 'Share must be between 0 and 100.');
            return;
        }

        setSavingLink(true);
        const result = await createProjectInvestorResult({
            projectId,
            userId: null,
            partyId: selectedInvestorContact.id,
            name: selectedInvestorContact.name,
            email: selectedInvestorContact.email || null,
            phone: selectedInvestorContact.mobile || null,
            investmentPercentage,
            isActive: true,
            canViewFinancials: true,
            canApprovePayments: false,
            canViewClientReceipts: true,
        });
        setSavingLink(false);

        if (!result.ok) {
            push('error', result.error || 'Could not link this investor right now. Please try again.');
            return;
        }

        push('success', 'Investor linked to this project successfully.');
        setLinkModalOpen(false);
        setSelectedContactId('');
        setContactSearch('');
        await loadInvestors();
    };

    const handleSaveTerms = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canManageInvestors) {
            push('error', 'You do not have permission to edit project investor terms.');
            return;
        }
        if (!editingTermsInvestor) return;

        const investmentPercentage = parseOptionalNumber(termsForm.investmentPercentage);
        if (investmentPercentage !== null && (investmentPercentage < 0 || investmentPercentage > 100)) {
            push('error', 'Share must be between 0 and 100.');
            return;
        }

        setSavingTerms(true);
        const result = await updateProjectInvestor(editingTermsInvestor.id, {
            investmentPercentage,
            isActive: termsForm.isActive,
        });
        setSavingTerms(false);

        if (!result) {
            push('error', 'Could not update project investor terms right now. Please try again.');
            return;
        }

        push('success', 'Project investor terms updated successfully.');
        setTermsModalOpen(false);
        setEditingTermsInvestor(null);
        await loadInvestors();
    };

    const handleDelete = async () => {
        if (!canManageInvestors) {
            push('error', 'You do not have permission to unlink investors.');
            return;
        }
        if (!deleteId) return;
        const ok = await deleteProjectInvestor(deleteId);
        setDeleteId(null);
        if (!ok) {
            push('error', 'Could not delete this investor right now. Please try again.');
            return;
        }
        push('success', 'Investor unlinked from this project successfully.');
        await loadInvestors();
    };

    const openContributionCreate = () => {
        if (!canManageInvestors) {
            push('error', 'You do not have permission to add contributions.');
            return;
        }
        if (!selectedInvestorId) {
            push('error', 'Select an investor first.');
            return;
        }
        setEditingContribution(null);
        setContributionForm({ investorId: selectedInvestorId, amount: '', contributionDate: '', referenceNumber: '', notes: '' });
        setContributionModalOpen(true);
    };

    const openContributionEdit = (row: InvestorContributionRecord) => {
        if (!canManageInvestors) {
            push('error', 'You do not have permission to edit contributions.');
            return;
        }
        setEditingContribution(row);
        setContributionForm({
            investorId: row.investorId,
            amount: String(row.amount ?? ''),
            contributionDate: asInputDate(row.contributionDate),
            referenceNumber: row.referenceNumber || '',
            notes: row.notes || '',
        });
        setContributionModalOpen(true);
    };

    const handleContributionSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canManageInvestors) {
            push('error', 'You do not have permission to save contributions.');
            return;
        }
        if (!contributionForm.investorId) {
            push('error', 'Investor is required for contribution.');
            return;
        }

        const amount = parseNumber(contributionForm.amount);
        if (amount === null || amount <= 0) {
            push('error', 'Contribution amount must be greater than 0.');
            return;
        }

        setSavingContribution(true);
        const payload = {
            amount,
            contributionDate: contributionForm.contributionDate || null,
            referenceNumber: contributionForm.referenceNumber.trim() || null,
            notes: contributionForm.notes.trim() || null,
        };

        const result = editingContribution
            ? await updateInvestorContribution(editingContribution.id, payload)
            : await createInvestorContribution({ investorId: contributionForm.investorId, ...payload });

        setSavingContribution(false);

        if (!result) {
            push('error', editingContribution ? 'Could not update this contribution right now. Please try again.' : 'Could not add this contribution right now. Please try again.');
            return;
        }

        push('success', editingContribution ? 'Contribution updated successfully.' : 'Contribution added successfully.');
        setSelectedInvestorId(contributionForm.investorId);
        setContributionModalOpen(false);
        await loadInvestors();
        await loadContributions(contributionForm.investorId);
    };

    const handleContributionDelete = async () => {
        if (!canManageInvestors) {
            push('error', 'You do not have permission to delete contributions.');
            return;
        }
        if (!deleteContributionId) return;
        const ok = await deleteInvestorContribution(deleteContributionId);
        setDeleteContributionId(null);
        if (!ok) {
            push('error', 'Could not delete this contribution right now. Please try again.');
            return;
        }
        push('success', 'Contribution deleted successfully.');
        await loadInvestors();
        await loadContributions(selectedInvestorId);
    };

    const selectedInvestor = investors.find((item) => item.id === selectedInvestorId) || null;
    const activeInvestors = investors.filter((item) => item.isActive);
    const agreedSharePercentage = activeInvestors.reduce((sum, item) => sum + Number(item.investmentPercentage ?? 0), 0);
    const agreedInvestmentAmount = projectContractValue > 0 ? (projectContractValue * agreedSharePercentage) / 100 : 0;
    const projectContributionTotal = Object.values(contributionTotalsByInvestorId).reduce((sum, amount) => sum + Number(amount ?? 0), 0);
    const contributionTotal = contributions.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading investors...</div>;

    return (
        <>
            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Linked investors</p>
                    <p className="mt-2 text-lg font-semibold text-[#17243A]">{activeInvestors.length}</p>
                </div>
                <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Agreed investment</p>
                    <p className="mt-2 text-lg font-semibold text-[#17243A]">{formatINR(agreedInvestmentAmount)}</p>
                    <p className="mt-1 text-xs text-[#667085]">Agreed share: {agreedSharePercentage.toFixed(2)}%</p>
                </div>
                <div className="rounded-xl border border-[#E6E8EC] bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Actual contributions</p>
                    <p className="mt-2 text-lg font-semibold text-[#17243A]">{formatINR(projectContributionTotal)}</p>
                </div>
            </div>

            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Investors</p>
                        <p className="mt-1 text-sm text-[#667085]">Link existing investor contacts to this project and maintain project-specific terms.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href="/investors" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#344054] hover:bg-slate-50">
                            <ArrowUpRight className="h-4 w-4" />
                            Open Investors
                        </a>
                        {canManageInvestors ? <AppButton variant="primary" onClick={openLinkInvestor}><Plus className="h-4 w-4" /> Link investor</AppButton> : null}
                    </div>
                </div>
                {investors.length === 0 ? (
                    <div className="mt-4"><EmptyState icon={<Users className="h-5 w-5" />} title="No investors linked" description="Link an existing investor from the Investors page to track project-level share and contributions." /></div>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                        <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                            <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                <tr>
                                    <th className="px-4 py-3">Investor</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Agreed share</th>
                                    <th className="px-4 py-3">Agreed investment</th>
                                    <th className="px-4 py-3">Status</th>
                                    {canManageInvestors ? <th className="px-4 py-3 text-right">Actions</th> : null}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                {investors.map((investor) => (
                                    <tr key={investor.id}>
                                        <td className="px-4 py-3 font-medium text-[#17243A]">{investor.name}</td>
                                        <td className="px-4 py-3 text-[#344054]">{investor.email || investor.phone || 'No contact'}</td>
                                        <td className="px-4 py-3 text-[#344054]">{investor.investmentPercentage !== null && investor.investmentPercentage !== undefined ? `${Number(investor.investmentPercentage).toFixed(2)}%` : '-'}</td>
                                        <td className="px-4 py-3 text-[#344054]">
                                            {projectContractValue > 0 && investor.investmentPercentage !== null && investor.investmentPercentage !== undefined
                                                ? formatINR((projectContractValue * Number(investor.investmentPercentage)) / 100)
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3"><StatusPill label={investor.isActive ? 'Active' : 'Inactive'} tone={investor.isActive ? 'success' : 'neutral'} /></td>
                                        {canManageInvestors ? (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openEditTerms(investor)}><Pencil className="h-4 w-4" /></AppButton>
                                                    <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteId(investor.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                                </div>
                                            </td>
                                        ) : null}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            <PremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-[#17243A]">Investor contributions</p>
                        <p className="mt-1 text-sm text-[#667085]">Track contribution history and capital inflow by investor.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canManageInvestors ? <AppButton variant="primary" onClick={openContributionCreate}><Plus className="h-4 w-4" /> Add contribution</AppButton> : null}
                    </div>
                </div>

                {!selectedInvestor ? (
                    <div className="mt-4"><EmptyState icon={<Users className="h-5 w-5" />} title="No investor selected" description="Choose an investor to view and manage contribution records." /></div>
                ) : contributions.length === 0 ? (
                    <div className="mt-4">
                        <EmptyState icon={<FileText className="h-5 w-5" />} title="No contributions added" description="Record contributions from this investor to build the funding ledger." />
                    </div>
                ) : (
                    <>
                        <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-slate-50 px-4 py-3 text-sm text-[#344054]">
                            <span className="font-medium text-[#17243A]">{selectedInvestor.name}</span> total contribution: <span className="font-semibold text-[#17243A]">{formatINR(contributionTotal)}</span>
                        </div>
                        <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E8EC]">
                            <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                                <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Notes</th>
                                        {canManageInvestors ? <th className="px-4 py-3 text-right">Actions</th> : null}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                    {contributions.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-4 py-3 text-[#344054]">{row.contributionDate ? formatDate(row.contributionDate) : '-'}</td>
                                            <td className="px-4 py-3 font-medium text-[#17243A]">{formatINR(Number(row.amount ?? 0))}</td>
                                            <td className="px-4 py-3 text-[#344054]">{row.referenceNumber || '-'}</td>
                                            <td className="px-4 py-3 text-[#344054]">{row.notes || '-'}</td>
                                            {canManageInvestors ? (
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <AppButton variant="ghost" className={tableEditButtonClass} onClick={() => openContributionEdit(row)}><Pencil className="h-4 w-4" /></AppButton>
                                                        <AppButton variant="danger" className={tableDeleteButtonClass} onClick={() => setDeleteContributionId(row.id)}><Trash2 className="h-4 w-4" /></AppButton>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </PremiumCard>

            {canManageInvestors && linkModalOpen && (
                <Modal eyebrow="Investor" title="Link existing investor" onClose={() => setLinkModalOpen(false)} size="lg">
                    <form onSubmit={handleLinkInvestor} className="space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <span className="text-sm font-medium text-[#17243A]">Select investor from company master</span>
                            <input
                                value={contactSearch}
                                onChange={(event) => setContactSearch(event.target.value)}
                                placeholder="Search investor contacts by name or phone"
                                className={`${inputClass} mb-2`}
                            />
                            {linkableInvestorContacts.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                                    No unlinked active investor contacts are available.
                                </div>
                            ) : (
                                <select
                                    value={selectedContactId}
                                    onChange={(event) => setSelectedContactId(event.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select an investor</option>
                                    {linkableInvestorContacts.map((party) => (
                                        <option key={party.id} value={party.id}>
                                            {party.name}{party.email ? ` • ${party.email}` : ''}{party.mobile ? ` • ${party.mobile}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-1">
                            <Field label="Agreed share % for this project">
                                <input type="number" min="0" max="100" step="0.01" className={inputClass} value={linkForm.investmentPercentage} onChange={(event) => setLinkForm((prev) => ({ ...prev, investmentPercentage: event.target.value }))} placeholder="Optional" />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setLinkModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={savingLink}>{savingLink ? 'Linking...' : 'Link investor'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            {canManageInvestors && termsModalOpen && editingTermsInvestor && (
                <Modal eyebrow="Project investor terms" title="Update project-specific terms" onClose={() => setTermsModalOpen(false)} size="lg">
                    <form onSubmit={handleSaveTerms} className="space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <span className="font-medium">Investor:</span> {editingTermsInvestor.name}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Agreed share %">
                                <input type="number" min="0" max="100" step="0.01" className={inputClass} value={termsForm.investmentPercentage} onChange={(event) => setTermsForm((prev) => ({ ...prev, investmentPercentage: event.target.value }))} />
                            </Field>
                            <label className="inline-flex items-center gap-2 text-sm text-[#344054] pt-8">
                                <input type="checkbox" checked={termsForm.isActive} onChange={(event) => setTermsForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
                                Active for this project
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setTermsModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={savingTerms}>{savingTerms ? 'Saving...' : 'Save terms'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={canManageInvestors && !!deleteId}
                title="Unlink investor?"
                message="This removes the investor from this project while keeping the master profile in the Investors page."
                danger
                confirmLabel="Unlink investor"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            {canManageInvestors && contributionModalOpen && (
                <Modal eyebrow="Contribution" title={editingContribution ? 'Edit contribution' : 'Add contribution'} onClose={() => setContributionModalOpen(false)} size="lg">
                    <form onSubmit={handleContributionSave} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Investor" required>
                                <select className={inputClass} value={contributionForm.investorId} onChange={(event) => setContributionForm((prev) => ({ ...prev, investorId: event.target.value }))}>
                                    <option value="">Select investor</option>
                                    {activeInvestors.map((investor) => (
                                        <option key={investor.id} value={investor.id}>{investor.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Amount" required>
                                <input type="number" min="0" step="0.01" className={inputClass} value={contributionForm.amount} onChange={(event) => setContributionForm((prev) => ({ ...prev, amount: event.target.value }))} />
                            </Field>
                            <Field label="Contribution date">
                                <input type="date" className={inputClass} value={contributionForm.contributionDate} onChange={(event) => setContributionForm((prev) => ({ ...prev, contributionDate: event.target.value }))} />
                            </Field>
                            <Field label="Reference number">
                                <input className={inputClass} value={contributionForm.referenceNumber} onChange={(event) => setContributionForm((prev) => ({ ...prev, referenceNumber: event.target.value }))} />
                            </Field>
                            <Field label="Notes">
                                <textarea className={`${inputClass} min-h-[96px]`} value={contributionForm.notes} onChange={(event) => setContributionForm((prev) => ({ ...prev, notes: event.target.value }))} />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <AppButton variant="secondary" onClick={() => setContributionModalOpen(false)}>Cancel</AppButton>
                            <AppButton type="submit" disabled={savingContribution}>{savingContribution ? 'Saving...' : editingContribution ? 'Save changes' : 'Add contribution'}</AppButton>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                open={canManageInvestors && !!deleteContributionId}
                title="Delete contribution?"
                message="This removes the selected contribution entry from investor funding history."
                danger
                confirmLabel="Delete contribution"
                onConfirm={handleContributionDelete}
                onCancel={() => setDeleteContributionId(null)}
            />
        </>
    );
}
