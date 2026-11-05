import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonLoader } from '@/components/loading/Loaders';
import {
    ProjectAttachmentsPanel,
    ProjectExecutionPanel,
    ProjectFinancePanel,
    ProjectInventoryPanel,
    ProjectOverviewPanel,
} from '@/components/projects/ProjectDetailTabs';
import { AppButton, EmptyState, PageHeader, PremiumCard, StatusPill, TabList, TablePagination } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { BUSINESS_MODEL_OPTIONS, calculateProjectedMargin, getBusinessModelFormConfig, type BusinessModel } from '@/lib/businessModels';
import { formatDate, formatINR } from '@/lib/utils';
import { listMasterData, type MasterItem } from '@/services/masterData.service';
import { listParties, type PartyRecord } from '@/services/party.service';
import { createProject, deleteProject, getProject, listProjects, updateProject, type ProjectRecord } from '@/services/project.service';
import { CalendarClock, Eye, FolderKanban, Info, MapPin, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

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

const ACTIVE_PROJECT_STATUSES: ProjectRecord['status'][] = ['planned', 'in_progress', 'on_hold'];

const formatCurrency = (value: number) => formatINR(Number(value ?? 0));

type ProjectFormState = {
    name: string;
    description: string;
    siteAddress: string;
    contractAmount: string;
    budgetAmount: string;
    projectedSalesValue: string;
    landCost: string;
    developmentArrangement: 'self' | 'joint_development';
    totalProjectFlats: string;
    landownerPartyId: string;
    jdaAgreementReference: string;
    jdaAgreementDocumentUrl: string;
    jdaAgreementDate: string;
    builderShareUnits: string;
    landownerShareUnits: string;
    startDate: string;
    expectedEndDate: string;
    projectTypeId: string;
    projectTypeSnapshot: string;
    businessModel: BusinessModel;
};

const getDefaultProjectFormState = (): ProjectFormState => ({
    name: '',
    description: '',
    siteAddress: '',
    contractAmount: '',
    budgetAmount: '',
    projectedSalesValue: '',
    landCost: '',
    developmentArrangement: 'self',
    totalProjectFlats: '',
    landownerPartyId: '',
    jdaAgreementReference: '',
    jdaAgreementDocumentUrl: '',
    jdaAgreementDate: '',
    builderShareUnits: '',
    landownerShareUnits: '',
    startDate: '',
    expectedEndDate: '',
    projectTypeId: '',
    projectTypeSnapshot: '',
    businessModel: BUSINESS_MODEL_OPTIONS[0]?.value ?? 'contract_construction',
});

const mapProjectToForm = (project: ProjectRecord): ProjectFormState => ({
    name: project.name,
    description: project.description ?? '',
    siteAddress: project.siteAddress ?? '',
    contractAmount: String(project.contractAmount ?? 0),
    budgetAmount: project.budgetAmount == null ? '' : String(project.budgetAmount),
    projectedSalesValue: String(project.projectedSalesValue ?? 0),
    landCost: String(project.landCost ?? 0),
    developmentArrangement: project.developmentArrangement ?? 'self',
    totalProjectFlats: project.totalProjectFlats == null ? '' : String(project.totalProjectFlats),
    landownerPartyId: project.landownerPartyId ?? '',
    jdaAgreementReference: project.jdaAgreementReference ?? '',
    jdaAgreementDocumentUrl: project.jdaAgreementDocumentUrl ?? '',
    jdaAgreementDate: project.jdaAgreementDate ?? '',
    builderShareUnits: project.builderShareUnits == null ? '' : String(project.builderShareUnits),
    landownerShareUnits: project.landownerShareUnits == null ? '' : String(project.landownerShareUnits),
    startDate: project.startDate ?? '',
    expectedEndDate: project.expectedEndDate ?? '',
    projectTypeId: project.projectTypeId ?? '',
    projectTypeSnapshot: project.projectTypeSnapshot ?? '',
    businessModel: project.businessModel ?? (BUSINESS_MODEL_OPTIONS[0]?.value ?? 'contract_construction'),
});

const getProjectFormErrorMessage = (form: ProjectFormState): string | null => {
    if (!form.name.trim()) {
        return 'Project name is required.';
    }

    const contractValue = form.contractAmount.trim() ? Number(form.contractAmount) : 0;
    const projectBudget = form.budgetAmount.trim() ? Number(form.budgetAmount) : null;
    const projectedSalesValue = form.projectedSalesValue.trim() ? Number(form.projectedSalesValue) : 0;
    const landCostValue = form.landCost.trim() ? Number(form.landCost) : 0;
    const isPropertyDevelopment = form.businessModel === 'property_development';
    const isJointDevelopment = isPropertyDevelopment && form.developmentArrangement === 'joint_development';

    if (!isPropertyDevelopment && (!Number.isFinite(contractValue) || contractValue < 0)) {
        return 'Contract amount must be 0 or greater.';
    }
    if (projectBudget !== null && (!Number.isFinite(projectBudget) || projectBudget < 0)) {
        return 'Estimated construction cost must be 0 or greater.';
    }
    if (!Number.isFinite(projectedSalesValue) || projectedSalesValue < 0) {
        return isJointDevelopment
            ? 'Builder share expected sales value must be 0 or greater.'
            : 'Expected flat sales value must be 0 or greater.';
    }
    if (!Number.isFinite(landCostValue) || landCostValue < 0) {
        return 'Land purchase cost must be 0 or greater.';
    }

    if (form.businessModel === 'property_development') {
        if (!form.developmentArrangement || (form.developmentArrangement !== 'self' && form.developmentArrangement !== 'joint_development')) {
            return 'Property development projects require a development type.';
        }

        if (form.developmentArrangement === 'joint_development') {
            const totalProjectFlatsValue = form.totalProjectFlats.trim() ? Number(form.totalProjectFlats) : null;
            const builderShareUnitsValue = form.builderShareUnits.trim() ? Number(form.builderShareUnits) : null;
            const landownerShareUnitsValue = form.landownerShareUnits.trim() ? Number(form.landownerShareUnits) : null;

            if (!form.landownerPartyId.trim()) {
                return 'Joint development requires a landowner.';
            }
            if (totalProjectFlatsValue === null) {
                return 'Joint development requires total flats.';
            }
            if (builderShareUnitsValue === null || landownerShareUnitsValue === null) {
                return 'Joint development requires builder flats and landowner flats.';
            }
            if (!Number.isInteger(totalProjectFlatsValue) || totalProjectFlatsValue <= 0) {
                return 'Total flats must be a whole number greater than zero.';
            }
            if (!Number.isInteger(builderShareUnitsValue) || builderShareUnitsValue < 0) {
                return "Builder's flats must be a non-negative whole number.";
            }
            if (!Number.isInteger(landownerShareUnitsValue) || landownerShareUnitsValue < 0) {
                return "Landowner's flats must be a non-negative whole number.";
            }
            if (builderShareUnitsValue + landownerShareUnitsValue !== totalProjectFlatsValue) {
                return 'Builder and landowner flats must add up to the total flats.';
            }
        }
    }

    const hasDevelopmentSpecificFields = [
        form.landownerPartyId,
        form.jdaAgreementReference,
        form.jdaAgreementDocumentUrl,
        form.jdaAgreementDate,
        form.totalProjectFlats,
        form.builderShareUnits,
        form.landownerShareUnits,
    ].some((value) => value !== undefined && value !== null && value.trim() !== '');

    if (hasDevelopmentSpecificFields && form.businessModel !== 'property_development') {
        return 'Development-specific fields are only used for property development projects.';
    }

    return null;
};

const clearJointDevelopmentFields = (form: ProjectFormState): ProjectFormState => ({
    ...form,
    totalProjectFlats: '',
    landownerPartyId: '',
    jdaAgreementReference: '',
    jdaAgreementDocumentUrl: '',
    jdaAgreementDate: '',
    builderShareUnits: '',
    landownerShareUnits: '',
});

function getProjectSummary(project: ProjectRecord) {
    return {
        location: project.siteAddress || project.customer?.address || 'Location pending',
        startDate: project.startDate ? formatDate(project.startDate) : 'Start date pending',
        expectedCompletionDate: project.expectedEndDate ? formatDate(project.expectedEndDate) : 'Completion date pending',
    };
}

function getProjectFinancialSummary(project: ProjectRecord) {
    const businessTypeLabel = BUSINESS_MODEL_OPTIONS.find((option) => option.value === project.businessModel)?.label ?? 'Business model pending';
    const expectedMargin = calculateProjectedMargin({
        businessModel: project.businessModel ?? 'contract_construction',
        developmentArrangement: project.developmentArrangement ?? 'self',
        contractAmount: project.contractAmount,
        budgetAmount: project.budgetAmount ?? 0,
        projectedSalesValue: project.projectedSalesValue ?? 0,
        landCost: project.landCost ?? 0,
    });

    if (project.businessModel === 'property_development') {
        return {
            title: businessTypeLabel,
            primary: `Projected sales: ${formatCurrency(project.projectedSalesValue ?? 0)}`,
            secondary: `Expected project profit: ${expectedMargin === null ? 'N/A' : formatCurrency(expectedMargin)}`,
        };
    }

    return {
        title: businessTypeLabel,
        primary: `Contract value: ${formatCurrency(project.contractAmount ?? 0)}`,
        secondary: `Expected project profit: ${expectedMargin === null ? 'N/A' : formatCurrency(expectedMargin)}`,
    };
}

const formFieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15';

function LandownerPartySelector({
    parties,
    selectedPartyId,
    onSelect,
    onClear,
}: {
    parties: PartyRecord[];
    selectedPartyId: string;
    onSelect: (partyId: string) => void;
    onClear: () => void;
}) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const selectedParty = useMemo(
        () => parties.find((party) => party.id === selectedPartyId) ?? null,
        [parties, selectedPartyId],
    );

    useEffect(() => {
        if (!selectedParty) {
            setQuery('');
            return;
        }
        setQuery(selectedParty.name);
    }, [selectedParty]);

    const filteredParties = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return parties;
        return parties.filter((party) => {
            const haystack = `${party.name} ${party.email} ${party.mobile}`.toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    }, [parties, query]);

    return (
        <div className="relative">
            {selectedParty ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#17243A]">
                    <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">Selected landowner</div>
                        <div className="truncate text-[#475569]">{selectedParty.name}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#17243A] transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                            onClick={() => {
                                setIsOpen(true);
                                setQuery(selectedParty.name);
                            }}
                        >
                            Change
                        </button>
                        <button
                            type="button"
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                            onClick={() => {
                                onClear();
                                setIsOpen(true);
                                setQuery('');
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    placeholder={selectedParty ? 'Search another landowner by name' : 'Search landowner by name'}
                    onFocus={() => setIsOpen(true)}
                    onChange={(event) => {
                        const nextQuery = event.target.value;
                        setQuery(nextQuery);
                        setIsOpen(true);
                    }}
                    className={formFieldClass}
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M9 3a6 6 0 104.725 10.275l3.436 3.436a1 1 0 101.414-1.414l-3.436-3.436A6 6 0 009 3zm0 2a4 4 0 110 8 4 4 0 010-8z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>

            {isOpen ? (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {filteredParties.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                            {filteredParties.map((party) => (
                                <button
                                    key={party.id}
                                    type="button"
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition ${selectedPartyId === party.id ? 'bg-[#EFF6FF] text-[#17243A]' : 'hover:bg-slate-50'}`}
                                    onClick={() => {
                                        onSelect(party.id);
                                        setQuery(party.name);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium">{party.name}</span>
                                        {party.email || party.mobile ? (
                                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                                                {party.email || party.mobile}
                                            </span>
                                        ) : null}
                                    </span>
                                    {selectedPartyId === party.id ? (
                                        <span className="rounded-full bg-[#1D4ED8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Selected</span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-3 text-sm text-slate-500">
                            No matching landowners found for this company. Try a different name.
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

function parseDateOnly(value: string | null | undefined): Date | null {
    if (!value) return null;
    const [yearText, monthText, dayText] = value.split('T')[0].split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return new Date(Date.UTC(year, month - 1, day));
}

function isWithinUpcomingDeadlineWindow(value: string | null | undefined, todayUtc: Date, windowEndUtc: Date): boolean {
    const parsed = parseDateOnly(value);
    if (!parsed) return false;
    return parsed >= todayUtc && parsed <= windowEndUtc;
}

function FieldInfoTooltip({
    text,
    label,
}: {
    text: string;
    label: string;
}) {
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const tooltipId = useMemo(() => `field-info-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, [label]);

    useEffect(() => {
        if (!open) return;

        const updatePosition = () => {
            const trigger = triggerRef.current;
            const tooltip = tooltipRef.current;
            if (!trigger || !tooltip) return;

            const viewportPadding = 8;
            const gap = 10;
            const triggerRect = trigger.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));

            const placeAbove = triggerRect.top >= tooltipRect.height + gap + viewportPadding;
            const top = placeAbove
                ? triggerRect.top - tooltipRect.height - gap
                : Math.min(triggerRect.bottom + gap, window.innerHeight - tooltipRect.height - viewportPadding);

            setPosition({ top, left });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (triggerRef.current?.contains(target) || tooltipRef.current?.contains(target)) return;
            setOpen(false);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <span className="relative inline-flex" onMouseLeave={() => setOpen(false)}>
            <button
                ref={triggerRef}
                type="button"
                onMouseEnter={() => setOpen(true)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onClick={(event) => {
                    event.preventDefault();
                    setOpen((prev) => !prev);
                }}
                aria-label={`More information about ${label}`}
                aria-expanded={open}
                aria-controls={tooltipId}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#2454D6] transition-colors hover:text-[#1D4ED8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2454D6]/35"
            >
                <Info className="h-3.5 w-3.5" />
            </button>

            {open ? (
                <div
                    id={tooltipId}
                    ref={tooltipRef}
                    role="tooltip"
                    style={{ top: position.top, left: position.left, position: 'fixed' }}
                    className="z-[70] max-w-[280px] rounded-xl border border-[#2454D6] bg-[#17243B] px-3 py-2 text-xs leading-5 text-[#F8FAFC] shadow-[0_14px_30px_rgba(16,28,47,0.35)]"
                >
                    {text}
                </div>
            ) : null}
        </span>
    );
}

function InputField({
    label,
    required,
    helper,
    children,
}: {
    label: string;
    required?: boolean;
    helper?: string;
    children: ReactNode;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#17243A]">
                <span>
                    {label}
                    {required ? <span className="text-red-600"> *</span> : null}
                </span>
                {helper ? <FieldInfoTooltip text={helper} label={label} /> : null}
            </span>
            {children}
        </label>
    );
}

function SectionCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <PremiumCard className="p-5">
            <p className="text-base font-semibold text-[#17243A]">{title}</p>
            {description ? <p className="mt-1 text-sm text-[#667085]">{description}</p> : null}
            <div className="mt-4">{children}</div>
        </PremiumCard>
    );
}

function ProjectFormLayout({
    mode,
    project,
}: {
    mode: 'create' | 'edit';
    project?: ProjectRecord | null;
}) {
    const navigate = useNavigate();
    const { push } = useToast();
    const [projectTypeOptions, setProjectTypeOptions] = useState<MasterItem[]>([]);
    const [partyOptions, setPartyOptions] = useState<PartyRecord[]>([]);
    const [form, setForm] = useState<ProjectFormState>(mode === 'edit' && project ? mapProjectToForm(project) : getDefaultProjectFormState());
    const [initialSnapshot, setInitialSnapshot] = useState<string>(JSON.stringify(mode === 'edit' && project ? mapProjectToForm(project) : getDefaultProjectFormState()));
    const [saving, setSaving] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (mode === 'edit' && project) {
            const mapped = mapProjectToForm(project);
            setForm(mapped);
            setInitialSnapshot(JSON.stringify(mapped));
        }
    }, [mode, project]);

    useEffect(() => {
        let active = true;
        void (async () => {
            const [projectTypes, parties] = await Promise.all([
                listMasterData('projectTypes'),
                listParties(undefined, 'all', '', { activeOnly: true }),
            ]);
            if (!active) return;
            setProjectTypeOptions(projectTypes);
            setPartyOptions(parties);
        })();
        return () => {
            active = false;
        };
    }, []);

    const hasUnsavedChanges = useMemo(() => JSON.stringify(form) !== initialSnapshot, [form, initialSnapshot]);

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const businessModelConfig = getBusinessModelFormConfig(form.businessModel);
    const submitLabel = mode === 'create' ? 'Create Project' : 'Save Project';
    const submitLoadingText = mode === 'create' ? 'Creating project…' : 'Saving project…';
    const projectedMargin = useMemo(
        () => calculateProjectedMargin({
            businessModel: form.businessModel,
            developmentArrangement: form.developmentArrangement,
            contractAmount: form.contractAmount,
            budgetAmount: form.budgetAmount,
            projectedSalesValue: form.projectedSalesValue,
            landCost: form.landCost,
        }),
        [form.budgetAmount, form.businessModel, form.contractAmount, form.developmentArrangement, form.landCost, form.projectedSalesValue],
    );

    const selectedProjectType = useMemo(
        () => projectTypeOptions.find((item) => item.id === form.projectTypeId) ?? null,
        [form.projectTypeId, projectTypeOptions],
    );

    const showLandCostField = form.businessModel === 'property_development' ? form.developmentArrangement === 'self' : businessModelConfig.showLandCost;
    const showProjectedSalesField = form.businessModel === 'property_development' && form.developmentArrangement === 'joint_development'
        ? true
        : businessModelConfig.showProjectedSalesValue;
    const salesFieldLabel = form.businessModel === 'property_development' && form.developmentArrangement === 'joint_development'
        ? 'Builder share expected sales value'
        : businessModelConfig.projectedSalesLabel ?? 'Projected sales value';
    const landFieldLabel = form.businessModel === 'property_development' && form.developmentArrangement === 'self'
        ? 'Land purchase cost'
        : businessModelConfig.landCostLabel ?? 'Land cost';
    const isPropertyDevelopment = form.businessModel === 'property_development';
    const isJointDevelopment = isPropertyDevelopment && form.developmentArrangement === 'joint_development';
    const showContractAmountField = !isPropertyDevelopment;
    const financialSectionDescription = isPropertyDevelopment && !isJointDevelopment
        ? 'Capture land investment, construction cost and expected property sales.'
        : 'Capture commercial assumptions used in margin and performance reporting.';

    const cancelPath = mode === 'create' ? '/projects' : `/projects/${project?.id ?? ''}`;

    const goCancel = () => {
        if (hasUnsavedChanges) {
            setShowCancelConfirm(true);
            return;
        }
        navigate(cancelPath);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (saving) return;

        const formError = getProjectFormErrorMessage(form);
        if (formError) {
            setValidationError(formError);
            push('error', formError);
            return;
        }

        setValidationError(null);

        const contractValue = form.contractAmount.trim() ? Number(form.contractAmount) : 0;
        const projectBudget = form.budgetAmount.trim() ? Number(form.budgetAmount) : null;
        const projectedSalesValue = form.projectedSalesValue.trim() ? Number(form.projectedSalesValue) : 0;
        const landCostValue = form.landCost.trim() ? Number(form.landCost) : 0;
        const totalProjectFlats = form.businessModel === 'property_development' && form.developmentArrangement === 'joint_development' && form.totalProjectFlats.trim()
            ? Number(form.totalProjectFlats)
            : null;
        const builderShareUnits = form.businessModel === 'property_development' && form.developmentArrangement === 'joint_development' && form.builderShareUnits.trim()
            ? Number(form.builderShareUnits)
            : null;
        const landownerShareUnits = totalProjectFlats !== null && builderShareUnits !== null ? totalProjectFlats - builderShareUnits : null;

        setSaving(true);

        if (mode === 'create') {
            const created = await createProject({
                name: form.name.trim(),
                description: form.description.trim() || null,
                siteAddress: form.siteAddress.trim() || null,
                contractAmount: contractValue,
                budgetAmount: projectBudget,
                projectedSalesValue,
                landCost: landCostValue,
                businessModel: form.businessModel,
                developmentArrangement: form.businessModel === 'property_development' ? form.developmentArrangement : null,
                totalProjectFlats,
                landownerPartyId: form.landownerPartyId || null,
                jdaAgreementReference: form.jdaAgreementReference || null,
                jdaAgreementDocumentUrl: form.jdaAgreementDocumentUrl || null,
                jdaAgreementDate: form.jdaAgreementDate || null,
                builderShareUnits,
                landownerShareUnits,
                startDate: form.startDate || null,
                expectedEndDate: form.expectedEndDate || null,
                status: 'planned',
                projectTypeId: selectedProjectType?.id ?? null,
                projectTypeSnapshot: form.projectTypeSnapshot || selectedProjectType?.name || null,
            });
            setSaving(false);

            if (!created) {
                push('error', 'Could not create the project right now. Please review the details and try again.');
                return;
            }

            push('success', 'Project created successfully.');
            navigate(`/projects/${created.id}`);
            return;
        }

        if (!project) {
            setSaving(false);
            push('error', 'Project details are missing.');
            return;
        }

        const updated = await updateProject(project.id, {
            name: form.name.trim(),
            description: form.description.trim() || null,
            siteAddress: form.siteAddress.trim() || null,
            contractAmount: contractValue,
            budgetAmount: projectBudget,
            projectedSalesValue,
            landCost: landCostValue,
            businessModel: form.businessModel,
            developmentArrangement: form.businessModel === 'property_development' ? form.developmentArrangement : null,
            totalProjectFlats,
            landownerPartyId: form.landownerPartyId || null,
            jdaAgreementReference: form.jdaAgreementReference || null,
            jdaAgreementDocumentUrl: form.jdaAgreementDocumentUrl || null,
            jdaAgreementDate: form.jdaAgreementDate || null,
            builderShareUnits,
            landownerShareUnits,
            startDate: form.startDate || null,
            expectedEndDate: form.expectedEndDate || null,
            projectTypeId: selectedProjectType?.id ?? null,
            projectTypeSnapshot: form.projectTypeSnapshot || selectedProjectType?.name || null,
        });
        setSaving(false);

        if (!updated) {
            push('error', 'Could not update the project right now.');
            return;
        }

        push('success', 'Project updated successfully.');
        navigate(`/projects/${updated.id}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={mode === 'create' ? 'Create Project' : 'Edit Project'}
                description={mode === 'create'
                    ? 'Set up project scope, financials and timeline in one place. You can refine details later from the project details page.'
                    : 'Update project information while keeping the existing business model and financial behavior intact.'}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <AppButton variant="secondary" onClick={goCancel}>Cancel</AppButton>
                        <AppButton type="submit" form="project-editor-form" loading={saving} loadingText={submitLoadingText}>
                            {submitLabel}
                        </AppButton>
                    </div>
                }
            />

            {validationError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{validationError}</div>
            ) : null}

            <form id="project-editor-form" onSubmit={handleSubmit} className="space-y-5">
                <SectionCard title="Project Information" description="Define the project identity, category and business type.">
                    <div className="grid gap-4 md:grid-cols-2">
                        <InputField label="Project name" required>
                            <input
                                className={formFieldClass}
                                value={form.name}
                                placeholder="e.g. Green Heights Phase 2"
                                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            />
                        </InputField>

                        <InputField label="Project category">
                            <select
                                value={form.projectTypeId}
                                onChange={(event) => {
                                    const nextValue = event.target.value;
                                    const selectedType = projectTypeOptions.find((item) => item.id === nextValue) ?? null;
                                    setForm((prev) => ({
                                        ...prev,
                                        projectTypeId: nextValue,
                                        projectTypeSnapshot: selectedType?.name ?? prev.projectTypeSnapshot,
                                    }));
                                }}
                                className={formFieldClass}
                            >
                                <option value="">Select project category (e.g. Residential Tower)</option>
                                {projectTypeOptions.map((type) => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </InputField>

                        <InputField label="Project category label">
                            <input
                                value={form.projectTypeSnapshot}
                                onChange={(event) => setForm((prev) => ({ ...prev, projectTypeSnapshot: event.target.value, projectTypeId: prev.projectTypeId }))}
                                placeholder="e.g. Premium Villa Cluster"
                                className={formFieldClass}
                            />
                        </InputField>

                        <InputField label="Business type" helper={BUSINESS_MODEL_OPTIONS.find((option) => option.value === form.businessModel)?.description ?? 'Choose the project business type.'}>
                            <select
                                value={form.businessModel}
                                onChange={(event) => {
                                    const nextModel = event.target.value as BusinessModel;
                                    setForm((prev) => {
                                        const nextState = {
                                            ...prev,
                                            businessModel: nextModel,
                                            developmentArrangement: nextModel === 'property_development' ? prev.developmentArrangement : 'self',
                                        };
                                        return nextModel !== 'property_development' ? clearJointDevelopmentFields(nextState) : nextState;
                                    });
                                }}
                                className={formFieldClass}
                            >
                                {BUSINESS_MODEL_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </InputField>

                        {form.businessModel === 'property_development' ? (
                            <InputField label="Development type" helper="Self-development hides JDA and landowner allocation. Joint development requires them.">
                                <select
                                    value={form.developmentArrangement}
                                    onChange={(event) => {
                                        const nextArrangement = event.target.value as 'self' | 'joint_development';
                                        setForm((prev) => {
                                            const nextState = { ...prev, developmentArrangement: nextArrangement };
                                            return nextArrangement === 'self' ? clearJointDevelopmentFields(nextState) : nextState;
                                        });
                                    }}
                                    className={formFieldClass}
                                >
                                    <option value="self">Self</option>
                                    <option value="joint_development">Joint development</option>
                                </select>
                            </InputField>
                        ) : null}

                        <InputField label="Project address">
                            <input
                                className={formFieldClass}
                                value={form.siteAddress}
                                placeholder="e.g. 45 MG Road, Bengaluru"
                                onChange={(event) => setForm((prev) => ({ ...prev, siteAddress: event.target.value }))}
                            />
                        </InputField>
                    </div>
                </SectionCard>

                <SectionCard title="Financial Details" description={financialSectionDescription}>
                    <div className="grid gap-4 md:grid-cols-2">
                        {showContractAmountField ? (
                            <InputField label={businessModelConfig.contractValueLabel} helper="Agreed amount payable by the customer for construction work.">
                                <input type="number" min="0" step="0.01" className={formFieldClass} placeholder="e.g. 75000000" value={form.contractAmount} onChange={(event) => setForm((prev) => ({ ...prev, contractAmount: event.target.value }))} />
                            </InputField>
                        ) : null}

                        <InputField
                            label={businessModelConfig.budgetLabel}
                            helper={isJointDevelopment
                                ? 'Required with builder share expected sales value to calculate builder profit.'
                                : 'Expected total cost to complete construction.'}
                        >
                            <input type="number" min="0" step="0.01" className={formFieldClass} placeholder="e.g. 52000000" value={form.budgetAmount} onChange={(event) => setForm((prev) => ({ ...prev, budgetAmount: event.target.value }))} />
                        </InputField>

                        {showLandCostField ? (
                            <InputField label={landFieldLabel} helper="Cost of purchasing land where applicable.">
                                <input type="number" min="0" step="0.01" className={formFieldClass} placeholder="e.g. 18000000" value={form.landCost} onChange={(event) => setForm((prev) => ({ ...prev, landCost: event.target.value }))} />
                            </InputField>
                        ) : null}

                        {showProjectedSalesField ? (
                            <InputField
                                label={salesFieldLabel}
                                helper={isJointDevelopment
                                    ? "Builder's expected sales value only. Landowner share and land value are excluded from builder profit."
                                    : 'Expected sale value where project revenue is unit-based.'}
                            >
                                <input type="number" min="0" step="0.01" className={formFieldClass} placeholder="e.g. 96000000" value={form.projectedSalesValue} onChange={(event) => setForm((prev) => ({ ...prev, projectedSalesValue: event.target.value }))} />
                            </InputField>
                        ) : null}

                        <div className="md:col-span-2">
                            <div className="rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] px-4 py-3">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-sm font-medium text-[#17243A]">Expected Project Profit</span>
                                    <span className="text-lg font-semibold text-[#17243A]" title={isJointDevelopment ? 'Builder share expected sales value minus estimated construction cost.' : 'Automatically calculated based on the selected business type'}>
                                        {projectedMargin === null ? 'N/A' : formatCurrency(projectedMargin)}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-[#64748B]">
                                    {isJointDevelopment
                                        ? 'Read-only estimate: Builder share expected sales value - estimated construction cost. Shows N/A when either value is missing.'
                                        : 'Read-only estimate based on selected business model, budget and projected revenue inputs.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {form.businessModel === 'property_development' && form.developmentArrangement === 'joint_development' ? (
                    <SectionCard title="Flat Allocation" description="Define builder and landowner unit allocation for JDA projects.">
                        <div className="grid gap-4 md:grid-cols-2">
                            <InputField label="Total flats" required helper="Total units in the project.">
                                <input type="number" min="1" step="1" className={formFieldClass} placeholder="e.g. 120" value={form.totalProjectFlats} onChange={(event) => setForm((prev) => ({ ...prev, totalProjectFlats: event.target.value }))} />
                            </InputField>

                            <InputField label="Builder's flats" required helper="Units allocated to the builder share.">
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className={formFieldClass}
                                    placeholder="e.g. 70"
                                    value={form.builderShareUnits}
                                    onChange={(event) => {
                                        const nextBuilderShare = event.target.value;
                                        const totalFlats = Number(form.totalProjectFlats || 0);
                                        const nextLandownerShare = totalFlats > 0 && nextBuilderShare !== '' ? String(Math.max(totalFlats - Number(nextBuilderShare), 0)) : '';
                                        setForm((prev) => ({ ...prev, builderShareUnits: nextBuilderShare, landownerShareUnits: nextLandownerShare }));
                                    }}
                                />
                            </InputField>

                            <InputField label="Landowner's flats" required helper="Automatically derived from total flats and builder share.">
                                <input type="number" min="0" step="1" readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-[#17243A] shadow-sm outline-none" placeholder="Auto-calculated" value={form.landownerShareUnits} />
                            </InputField>
                        </div>
                    </SectionCard>
                ) : null}

                {form.businessModel === 'property_development' && form.developmentArrangement === 'joint_development' ? (
                    <SectionCard title="JDA Details" description="Capture landowner and agreement references for compliance and audits.">
                        <div className="grid gap-4 md:grid-cols-2">
                            <InputField label="Landowner" required helper="Search and select the landowner party linked to this development agreement.">
                                <LandownerPartySelector
                                    parties={partyOptions}
                                    selectedPartyId={form.landownerPartyId}
                                    onSelect={(partyId) => setForm((prev) => ({ ...prev, landownerPartyId: partyId }))}
                                    onClear={() => setForm((prev) => ({ ...prev, landownerPartyId: '' }))}
                                />
                            </InputField>

                            <InputField label="JDA agreement number" helper="Agreement reference number from legal document.">
                                <input className={formFieldClass} placeholder="e.g. JDA-2026-014" value={form.jdaAgreementReference} onChange={(event) => setForm((prev) => ({ ...prev, jdaAgreementReference: event.target.value }))} />
                            </InputField>

                            <InputField label="JDA document link" helper="URL for signed agreement, if stored externally.">
                                <input className={formFieldClass} placeholder="e.g. https://docs.company.com/jda/phase2" value={form.jdaAgreementDocumentUrl} onChange={(event) => setForm((prev) => ({ ...prev, jdaAgreementDocumentUrl: event.target.value }))} />
                            </InputField>

                            <InputField label="JDA date" helper="Date on which agreement was executed (YYYY-MM-DD).">
                                <input type="date" className={formFieldClass} placeholder="YYYY-MM-DD" value={form.jdaAgreementDate} onChange={(event) => setForm((prev) => ({ ...prev, jdaAgreementDate: event.target.value }))} />
                            </InputField>
                        </div>
                    </SectionCard>
                ) : null}

                <SectionCard title="Project Timeline" description="Capture expected delivery dates and implementation notes.">
                    <div className="grid gap-4 md:grid-cols-2">
                        <InputField label="Start date">
                            <input type="date" className={formFieldClass} placeholder="YYYY-MM-DD" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} />
                        </InputField>

                        <InputField label="Expected end date">
                            <input type="date" className={formFieldClass} placeholder="YYYY-MM-DD" value={form.expectedEndDate} onChange={(event) => setForm((prev) => ({ ...prev, expectedEndDate: event.target.value }))} />
                        </InputField>

                        <div className="md:col-span-2">
                            <InputField label="Project notes">
                                <textarea className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#17243A] shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15" placeholder="e.g. Basement raft completion expected before monsoon window" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                            </InputField>
                        </div>
                    </div>
                </SectionCard>

                <div className="sticky bottom-0 rounded-2xl border border-[#E6E8EC] bg-white/95 p-4 shadow-[0_-4px_14px_rgba(15,23,42,0.08)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-[#64748B]">
                            {hasUnsavedChanges ? 'You have unsaved changes.' : mode === 'create' ? 'Ready to create project. Fill details and submit when ready.' : 'All changes saved.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <AppButton variant="secondary" onClick={goCancel}>Cancel</AppButton>
                            <AppButton type="submit" loading={saving} loadingText={submitLoadingText}>
                                {submitLabel}
                            </AppButton>
                        </div>
                    </div>
                </div>
            </form>

            <ConfirmDialog
                open={showCancelConfirm}
                title="Discard unsaved changes?"
                message="You have unsaved edits on this form. Leaving now will discard those changes."
                confirmLabel="Discard changes"
                onConfirm={() => navigate(cancelPath)}
                onCancel={() => setShowCancelConfirm(false)}
                danger
            />
        </div>
    );
}

export default function ProjectsPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);
    const [deletingProject, setDeletingProject] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ProjectRecord['status']>('all');
    const [statusScopeFilter, setStatusScopeFilter] = useState<'all' | 'active'>('all');
    const [businessFilter, setBusinessFilter] = useState<'all' | BusinessModel>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'upcoming_30_days'>('all');
    const [loadError, setLoadError] = useState<string | null>(null);

    const pageSize = 10;

    const loadProjects = async () => {
        try {
            setLoading(true);
            setLoadError(null);
            const rows = await listProjects();
            setProjects(rows);
        } catch (error) {
            console.error(error);
            setLoadError('Could not load projects right now. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadProjects();
    }, []);

    const nonDeletedProjects = useMemo(
        () => projects.filter((project) => !project.deletedAt && project.isDeleted !== true),
        [projects],
    );

    const todayUtc = useMemo(() => {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }, []);

    const upcomingWindowEndUtc = useMemo(() => {
        const value = new Date(todayUtc.getTime());
        value.setUTCDate(value.getUTCDate() + 30);
        return value;
    }, [todayUtc]);

    const filteredProjects = useMemo(() => {
        const term = search.trim().toLowerCase();
        return nonDeletedProjects.filter((project) => {
            if (statusScopeFilter === 'active' && !ACTIVE_PROJECT_STATUSES.includes(project.status)) return false;
            if (statusFilter !== 'all' && project.status !== statusFilter) return false;
            if (businessFilter !== 'all' && project.businessModel !== businessFilter) return false;
            if (categoryFilter !== 'all' && (project.projectTypeSnapshot ?? 'Unspecified') !== categoryFilter) return false;
            if (deadlineFilter === 'upcoming_30_days' && !isWithinUpcomingDeadlineWindow(project.expectedEndDate, todayUtc, upcomingWindowEndUtc)) {
                return false;
            }
            if (!term) return true;

            const haystack = [
                project.name,
                project.siteAddress,
                project.customer?.address,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(term);
        });
    }, [businessFilter, categoryFilter, deadlineFilter, nonDeletedProjects, search, statusFilter, statusScopeFilter, todayUtc, upcomingWindowEndUtc]);

    const categoryOptions = useMemo(() => {
        const uniqueCategories = new Set<string>();
        nonDeletedProjects.forEach((project) => uniqueCategories.add(project.projectTypeSnapshot || 'Unspecified'));
        return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b));
    }, [nonDeletedProjects]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
        if (page > totalPages) setPage(totalPages);
    }, [filteredProjects.length, page]);

    const pagedProjects = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredProjects.slice(start, start + pageSize);
    }, [filteredProjects, page]);

    const handleDeleteProject = async () => {
        if (!projectToDelete || deletingProject) return;

        setDeletingProject(true);
        const ok = await deleteProject(projectToDelete.id);
        setDeletingProject(false);

        if (!ok) {
            push('error', 'Could not delete this project right now. Please try again.');
            return;
        }

        setProjectToDelete(null);
        push('success', 'Project deleted successfully.');
        await loadProjects();
    };

    const clearFilters = () => {
        setSearch('');
        setStatusScopeFilter('all');
        setStatusFilter('all');
        setBusinessFilter('all');
        setCategoryFilter('all');
        setDeadlineFilter('all');
        setPage(1);
    };

    const totalProjectsCount = nonDeletedProjects.length;
    const activeProjectsCount = nonDeletedProjects.filter((project) => ACTIVE_PROJECT_STATUSES.includes(project.status)).length;
    const completedProjectsCount = nonDeletedProjects.filter((project) => project.status === 'completed').length;
    const upcomingDeadlinesCount = nonDeletedProjects.filter((project) => isWithinUpcomingDeadlineWindow(project.expectedEndDate, todayUtc, upcomingWindowEndUtc)).length;

    const applyKpiFilter = (kind: 'total' | 'active' | 'completed' | 'upcoming') => {
        setPage(1);
        if (kind === 'total') {
            clearFilters();
            return;
        }

        setDeadlineFilter('all');
        if (kind === 'active') {
            setStatusScopeFilter('active');
            setStatusFilter('all');
            setDeadlineFilter('all');
            setSearch('');
            return;
        }
        setStatusScopeFilter('all');
        if (kind === 'completed') {
            setStatusFilter('completed');
            setSearch('');
            return;
        }

        setStatusFilter('all');
        setDeadlineFilter('upcoming_30_days');
        setSearch('');
    };

    const isActiveKpiFilter = statusScopeFilter === 'all' && statusFilter === 'all' && deadlineFilter === 'all' && search.trim().length === 0;
    const summaryCards = [
        {
            id: 'total' as const,
            label: 'Total Projects',
            value: totalProjectsCount,
            note: 'All non-deleted projects',
            active: isActiveKpiFilter,
        },
        {
            id: 'active' as const,
            label: 'Active Projects',
            value: activeProjectsCount,
            note: 'Planned, in-progress, and on-hold',
            active: statusScopeFilter === 'active' && statusFilter === 'all' && deadlineFilter === 'all',
        },
        {
            id: 'completed' as const,
            label: 'Completed Projects',
            value: completedProjectsCount,
            note: 'Status: completed',
            active: statusFilter === 'completed' && deadlineFilter === 'all',
        },
        {
            id: 'upcoming' as const,
            label: 'Upcoming Deadlines',
            value: upcomingDeadlinesCount,
            note: 'Due from today through next 30 days',
            active: deadlineFilter === 'upcoming_30_days',
        },
    ];

    const hasFiltersApplied = statusScopeFilter !== 'all' || statusFilter !== 'all' || businessFilter !== 'all' || categoryFilter !== 'all' || deadlineFilter !== 'all' || search.trim().length > 0;

    return (
        <div className="space-y-4">
            <PageHeader
                title="Projects"
                actions={
                    <AppButton className="shadow-[0_8px_18px_rgba(23,36,59,0.18)]" onClick={() => navigate('/projects/new')}>
                        <Plus className="h-4 w-4" />
                        New Project
                    </AppButton>
                }
            />

            <div className="rounded-[24px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#F8FAFC_0%,#EEF4FF_100%)] p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <button
                            key={card.label}
                            type="button"
                            disabled={loading || Boolean(loadError)}
                            onClick={() => applyKpiFilter(card.id)}
                            className={`group w-full rounded-2xl border px-4 py-3.5 text-left shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/30 disabled:cursor-not-allowed disabled:opacity-70 ${card.active
                                ? 'border-[#F4B72B] bg-[linear-gradient(130deg,#FFF9E8_0%,#FFFFFF_75%)]'
                                : 'border-white/80 bg-white/90 hover:-translate-y-0.5 hover:border-[#F4B72B]/60 hover:shadow-[0_10px_22px_rgba(23,36,59,0.1)]'}`}
                            aria-pressed={card.active}
                        >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">{card.label}</p>
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                                <p className="text-2xl font-bold tracking-[-0.04em] text-[#17243B]">
                                    {loading ? '...' : loadError ? '--' : String(card.value)}
                                </p>
                                <span className={`h-2.5 w-2.5 rounded-full ${card.active ? 'bg-[#F4B72B]' : 'bg-[#D0D5DD] group-hover:bg-[#F4B72B]/70'}`} />
                            </div>
                            <p className="mt-1.5 text-[11px] leading-4 text-[#667085]">
                                {loadError ? 'Unavailable while projects could not be loaded.' : card.note}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <PremiumCard className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <label className="relative block lg:flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by project name or address"
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-[#17243A] outline-none transition-colors focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
                        />
                    </label>

                    <label className="block lg:w-52">
                        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-[#667085]">Status</span>
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusScopeFilter('all');
                                setStatusFilter(event.target.value as 'all' | ProjectRecord['status']);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none transition-colors focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
                        >
                            <option value="all">All statuses</option>
                            {Object.keys(statusLabelMap).map((status) => (
                                <option key={status} value={status}>{statusLabelMap[status]}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block lg:w-52">
                        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-[#667085]">Business type</span>
                        <select value={businessFilter} onChange={(event) => setBusinessFilter(event.target.value as 'all' | BusinessModel)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none transition-colors focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15">
                            <option value="all">All business types</option>
                            {BUSINESS_MODEL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block lg:w-52">
                        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-[#667085]">Project category</span>
                        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17243A] outline-none transition-colors focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15">
                            <option value="all">All categories</option>
                            {categoryOptions.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </label>
                </div>
                {hasFiltersApplied ? (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#E6E8EC] bg-slate-50 px-3 py-2 text-xs text-[#667085]">
                        <span className="inline-flex items-center gap-1"><SlidersHorizontal className="h-3.5 w-3.5" /> Showing {filteredProjects.length} matching projects</span>
                        <button type="button" onClick={clearFilters} className="font-medium text-[#1D4ED8] hover:underline">
                            Clear filters
                        </button>
                    </div>
                ) : null}
            </PremiumCard>

            {loadError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {loadError}
                </div>
            ) : null}

            {loading ? (
                <SkeletonLoader variant="table" rows={6} className="rounded-[24px]" />
            ) : nonDeletedProjects.length === 0 ? (
                <EmptyState
                    icon={<FolderKanban className="h-5 w-5" />}
                    title="No projects yet"
                    description="Create your first project to start tracking scope, budget and delivery milestones."
                    action={<AppButton onClick={() => navigate('/projects/new')}>Create your first project</AppButton>}
                />
            ) : filteredProjects.length === 0 ? (
                <EmptyState
                    icon={<FolderKanban className="h-5 w-5" />}
                    title="No matching projects"
                    description="No projects match your current search and filter combination."
                    action={<AppButton variant="secondary" onClick={clearFilters}>Clear Filters</AppButton>}
                />
            ) : (
                <>
                    <div className="space-y-3 md:hidden">
                        {pagedProjects.map((project) => {
                            const summary = getProjectSummary(project);
                            const financialSummary = getProjectFinancialSummary(project);
                            return (
                                <PremiumCard key={project.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-[#17243A]">{project.name}</p>
                                            <p className="mt-1 text-xs text-[#667085]">{project.projectNumber || 'Project number pending'}</p>
                                        </div>
                                        <StatusPill label={statusLabelMap[project.status] ?? project.status} tone={statusToneMap[project.status] ?? 'neutral'} />
                                    </div>
                                    <div className="mt-3 space-y-1.5 text-sm text-[#475467]">
                                        <p><span className="font-medium text-[#344054]">Category:</span> {project.projectTypeSnapshot || 'Unspecified'}</p>
                                        <p><span className="font-medium text-[#344054]">Business type:</span> {financialSummary.title}</p>
                                        <p><span className="font-medium text-[#344054]">Location:</span> {summary.location}</p>
                                        <p><span className="font-medium text-[#344054]">Start:</span> {project.startDate ? formatDate(project.startDate) : 'Pending'} • <span className="font-medium text-[#344054]">End:</span> {project.expectedEndDate ? formatDate(project.expectedEndDate) : 'Pending'}</p>
                                        <p><span className="font-medium text-[#344054]">{financialSummary.primary}</span></p>
                                        <p className="text-xs text-[#667085]">{financialSummary.secondary}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-end gap-2">
                                        <AppButton variant="secondary" onClick={() => navigate(`/projects/${project.id}`)}>
                                            <Eye className="h-4 w-4" /> View
                                        </AppButton>
                                        <AppButton variant="secondary" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                                            <Pencil className="h-4 w-4" /> Edit
                                        </AppButton>
                                        <AppButton variant="danger" onClick={() => setProjectToDelete(project)}>
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </AppButton>
                                    </div>
                                </PremiumCard>
                            );
                        })}
                    </div>

                    <div className="hidden md:block">
                        <div className="overflow-hidden rounded-[24px] border border-[#E6E8EC] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                                    <thead className="bg-[#17243B] text-[11px] uppercase tracking-[0.12em] text-white">
                                        <tr>
                                            <th className="px-4 py-3.5 text-left font-semibold text-white">Project</th>
                                            <th className="px-4 py-3.5 text-left font-semibold text-white">Category</th>
                                            <th className="px-4 py-3.5 text-left font-semibold text-white">Business type</th>
                                            <th className="px-4 py-3.5 text-left font-semibold text-white">Timeline</th>
                                            <th className="px-4 py-3.5 text-left font-semibold text-white">Financial summary</th>
                                            <th className="px-4 py-3.5 text-left font-semibold text-white">Status</th>
                                            <th className="px-4 py-3.5 text-center font-semibold text-white">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E6E8EC] bg-white">
                                        {pagedProjects.map((project) => {
                                            const summary = getProjectSummary(project);
                                            const financialSummary = getProjectFinancialSummary(project);
                                            return (
                                                <tr key={project.id} className="transition-colors hover:bg-slate-50/80">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF1FF] text-sm font-semibold text-[#2454D6]">
                                                                {project.name.slice(0, 1).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-[#17243A]">{project.name}</p>
                                                                <p className="text-xs text-[#667085]">{project.projectNumber || 'Project number pending'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-[#344054]">{project.projectTypeSnapshot || 'Unspecified'}</td>
                                                    <td className="px-4 py-3.5 text-[#344054]">
                                                        <p className="font-medium text-[#17243A]">{financialSummary.title}</p>
                                                        <p className="text-xs text-[#667085]">{summary.location}</p>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-[#344054]">
                                                        <p>Start: {project.startDate ? formatDate(project.startDate) : 'Pending'}</p>
                                                        <p>End: {project.expectedEndDate ? formatDate(project.expectedEndDate) : 'Pending'}</p>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <p className="font-semibold text-[#17243A]">{financialSummary.primary}</p>
                                                        <p className="text-xs text-[#667085]">{financialSummary.secondary}</p>
                                                    </td>
                                                    <td className="px-4 py-3.5"><StatusPill label={statusLabelMap[project.status] ?? project.status} tone={statusToneMap[project.status] ?? 'neutral'} /></td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <AppButton
                                                                variant="secondary"
                                                                className="!px-2.5 !py-1.5"
                                                                onClick={() => navigate(`/projects/${project.id}`)}
                                                                aria-label={`View ${project.name}`}
                                                                title="View project"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </AppButton>
                                                            <AppButton
                                                                variant="secondary"
                                                                className="!px-2.5 !py-1.5"
                                                                onClick={() => navigate(`/projects/${project.id}/edit`)}
                                                                aria-label={`Edit ${project.name}`}
                                                                title="Edit project"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </AppButton>
                                                            <AppButton
                                                                variant="danger"
                                                                className="!px-2.5 !py-1.5"
                                                                onClick={() => setProjectToDelete(project)}
                                                                aria-label={`Delete ${project.name}`}
                                                                title="Delete project"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </AppButton>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[20px] border border-[#E6E8EC] bg-white px-3 py-2 shadow-sm">
                        <TablePagination page={page} pageSize={pageSize} total={filteredProjects.length} onPageChange={setPage} />
                    </div>
                </>
            )}

            {projectToDelete ? (
                <ConfirmDialog
                    open={Boolean(projectToDelete)}
                    title="Delete project?"
                    message={`This will permanently remove "${projectToDelete.name}" and associated project data. This action cannot be undone.`}
                    confirmLabel={deletingProject ? 'Deleting…' : 'Delete project'}
                    onConfirm={handleDeleteProject}
                    onCancel={() => setProjectToDelete(null)}
                    danger
                />
            ) : null}
        </div>
    );
}

export function ProjectCreatePage() {
    return <ProjectFormLayout mode="create" />;
}

export function ProjectEditPage() {
    const { id } = useParams();
    const [project, setProject] = useState<ProjectRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setLoadError('Project ID is missing.');
            return;
        }

        let active = true;
        void (async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const result = await getProject(id);
                if (!active) return;
                if (!result) {
                    setLoadError('Project not found.');
                    setProject(null);
                } else {
                    setProject(result);
                }
            } catch (error) {
                console.error(error);
                if (!active) return;
                setLoadError('Could not load this project right now.');
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return <SkeletonLoader variant="page" />;
    }

    if (loadError || !project) {
        return (
            <PremiumCard className="p-6">
                <p className="text-base font-semibold text-[#17243A]">Unable to open project editor</p>
                <p className="mt-2 text-sm text-[#667085]">{loadError || 'Project not found.'}</p>
                <div className="mt-4">
                    <Link to="/projects" className="text-sm font-medium text-[#1D4ED8] hover:underline">Back to projects</Link>
                </div>
            </PremiumCard>
        );
    }

    return <ProjectFormLayout mode="edit" project={project} />;
}

export function ProjectDetailPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const { id } = useParams();
    const { company } = useCompany();
    const [searchParams, setSearchParams] = useSearchParams();
    const [project, setProject] = useState<ProjectRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);
    const [deletingProject, setDeletingProject] = useState(false);

    useEffect(() => {
        if (!id) {
            setProject(null);
            setLoadError('Project ID is missing.');
            setLoading(false);
            return;
        }

        let active = true;
        void (async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const result = await getProject(id);
                if (!active) return;
                if (!result) {
                    setProject(null);
                    setLoadError('Project not found.');
                } else {
                    setProject(result);
                }
            } catch (error) {
                console.error(error);
                if (!active) return;
                setLoadError('Could not load project details right now.');
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [id]);

    const activeTab = searchParams.get('tab') || 'Overview';

    if (loading) {
        return <SkeletonLoader variant="page" />;
    }

    if (loadError || !project) {
        return (
            <PremiumCard className="p-6">
                <p className="text-base font-semibold text-[#17243A]">Unable to load project</p>
                <p className="mt-2 text-sm text-[#667085]">{loadError || 'Project not found.'}</p>
                <div className="mt-4 flex items-center gap-2">
                    <AppButton variant="secondary" onClick={() => navigate('/projects')}>Back to projects</AppButton>
                    {id ? <AppButton onClick={() => navigate(`/projects/${id}`)}>Retry</AppButton> : null}
                </div>
            </PremiumCard>
        );
    }

    const summary = getProjectSummary(project);
    const customerMobile = project.customer?.mobile ?? null;
    const canManage = company?.callerRole === 'owner' || company?.callerRole === 'admin';
    const businessTypeLabel = BUSINESS_MODEL_OPTIONS.find((option) => option.value === project.businessModel)?.label ?? 'Not selected';
    const hasInventoryTab = project.businessModel === 'property_development' || project.businessModel === 'material_supply';
    const detailTabs = [
        { id: 'Overview', label: 'Overview' },
        { id: 'Execution', label: 'Execution' },
        { id: 'Finance', label: 'Finance' },
        ...(hasInventoryTab ? [{ id: 'Inventory', label: 'Inventory' }] : []),
        { id: 'Documents', label: 'Documents' },
    ];

    const availableTabs = new Set(detailTabs.map((tab) => tab.id));
    const resolvedActiveTab = availableTabs.has(activeTab) ? activeTab : 'Overview';

    const changeTab = (tab: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
    };

    const handleDeleteProject = async () => {
        if (!project || deletingProject) return;

        setDeletingProject(true);
        const ok = await deleteProject(project.id);
        setDeletingProject(false);

        if (!ok) {
            push('error', 'Could not delete this project right now. Please try again.');
            return;
        }

        setProjectToDelete(null);
        push('success', 'Project deleted successfully.');
        navigate('/projects');
    };

    const openExpensesForProject = () => navigate(`/expenses?projectId=${encodeURIComponent(project.id)}&workflow=supplier`);
    const openInvoicesForProject = () => navigate(`/invoices?projectId=${encodeURIComponent(project.id)}`);
    const openReceiptsForProject = () => navigate(`/receipts?projectId=${encodeURIComponent(project.id)}`);
    const openReportsForProject = () => navigate(`/reports?projectId=${encodeURIComponent(project.id)}`);

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#F8FAFC_0%,#EEF4FF_100%)] p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#667085]">Project Details</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#17243A] sm:text-[2rem]">{project.name}</h1>
                            <StatusPill label={statusLabelMap[project.status] ?? project.status} tone={statusToneMap[project.status] ?? 'neutral'} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white/75 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Project Number</p>
                                <p className="mt-1.5 text-sm font-semibold text-[#17243A]">{project.projectNumber || 'Project number pending'}</p>
                            </div>
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white/75 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Project Category</p>
                                <p className="mt-1.5 text-sm font-semibold text-[#17243A]">{project.projectTypeSnapshot || 'Project category pending'}</p>
                            </div>
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white/75 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Business Type</p>
                                <p className="mt-1.5 text-sm font-semibold text-[#17243A]">{businessTypeLabel}</p>
                            </div>
                            {project.businessModel === 'property_development' ? (
                                <div className="rounded-2xl border border-[#E2E8F0] bg-white/75 px-3 py-2.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Development Arrangement</p>
                                    <p className="mt-1.5 text-sm font-semibold text-[#17243A]">
                                        {project.developmentArrangement === 'joint_development' ? 'Joint Development' : 'Self'}
                                    </p>
                                </div>
                            ) : null}
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white/75 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Location</p>
                                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#17243A]"><MapPin className="h-3.5 w-3.5 text-[#64748B]" /> {summary.location}</p>
                            </div>
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white/75 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Start Date</p>
                                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#17243A]"><CalendarClock className="h-3.5 w-3.5 text-[#64748B]" /> {summary.startDate}</p>
                            </div>
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white/75 px-3 py-2.5 lg:col-span-1 xl:col-span-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Expected Completion</p>
                                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#17243A]"><CalendarClock className="h-3.5 w-3.5 text-[#64748B]" /> {summary.expectedCompletionDate}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 self-start">
                        <AppButton
                            variant="primary"
                            className="w-[136px] shrink-0 justify-center"
                            onClick={() => navigate(`/projects/${project.id}/edit`)}
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </AppButton>
                        <AppButton
                            variant="danger"
                            className="w-[136px] shrink-0 justify-center"
                            onClick={() => setProjectToDelete(project)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </AppButton>
                    </div>
                </div>

                <div className="mt-5">
                    <TabList tabs={detailTabs} active={resolvedActiveTab} onChange={changeTab} />
                </div>
            </div>

            {resolvedActiveTab === 'Overview' ? <ProjectOverviewPanel project={project} /> : null}

            {resolvedActiveTab === 'Execution' ? <ProjectExecutionPanel projectId={project.id} /> : null}

            {resolvedActiveTab === 'Finance' ? (
                <ProjectFinancePanel
                    projectId={project.id}
                    customerMobile={customerMobile}
                    projectName={project.name}
                    contractValue={Number(project.contractAmount ?? 0)}
                    projectBudget={Number(project.budgetAmount ?? 0)}
                    onManageExpenses={openExpensesForProject}
                    onManageInvoices={openInvoicesForProject}
                    onManageReceipts={openReceiptsForProject}
                />
            ) : null}

            {resolvedActiveTab === 'Inventory' && hasInventoryTab ? (
                <ProjectInventoryPanel project={project} />
            ) : null}

            {resolvedActiveTab === 'Documents' ? <ProjectAttachmentsPanel projectId={project.id} canManage={canManage} project={project} /> : null}

            {projectToDelete ? (
                <ConfirmDialog
                    open={Boolean(projectToDelete)}
                    title="Delete project?"
                    message={`This will permanently remove "${projectToDelete.name}" and associated project data. This action cannot be undone.`}
                    confirmLabel={deletingProject ? 'Deleting…' : 'Delete project'}
                    onConfirm={handleDeleteProject}
                    onCancel={() => setProjectToDelete(null)}
                    danger
                />
            ) : null}
        </div>
    );
}
