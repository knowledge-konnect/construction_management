import {
    AppButton,
    DataTable,
    EmptyState,
    Modal,
    PageHeader,
    PremiumCard,
    SkeletonRow,
    StatusPill,
    TabList,
} from '@/components/ui/DesignSystem';
import { Checkbox, Field, Radio, SectionCard, Select, TextArea, TextInput } from '@/components/ui/Form';
import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Download,
    FileText,
    Layers3,
    Search,
    Sparkles,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'quotes', label: 'Quotations' },
    { id: 'payments', label: 'Payments' },
];

const tableHeaders = ['Project', 'Value', 'Status', 'Owner'];
const tableRows = [
    <tr key="1" className="hover:bg-slate-50">
        <td className="px-4 py-3 font-medium text-[var(--text)]">Green Valley Residency</td>
        <td className="px-4 py-3 text-[var(--text-secondary)]">₹18.4L</td>
        <td className="px-4 py-3"><StatusPill label="In progress" tone="info" /></td>
        <td className="px-4 py-3 text-[var(--text-secondary)]">A. Sharma</td>
    </tr>,
    <tr key="2" className="hover:bg-slate-50">
        <td className="px-4 py-3 font-medium text-[var(--text)]">City Plaza</td>
        <td className="px-4 py-3 text-[var(--text-secondary)]">₹42.9L</td>
        <td className="px-4 py-3"><StatusPill label="Pending" tone="warning" /></td>
        <td className="px-4 py-3 text-[var(--text-secondary)]">N. Patel</td>
    </tr>,
    <tr key="3" className="hover:bg-slate-50">
        <td className="px-4 py-3 font-medium text-[var(--text)]">Lakeview Villas</td>
        <td className="px-4 py-3 text-[var(--text-secondary)]">₹31.1L</td>
        <td className="px-4 py-3"><StatusPill label="Completed" tone="success" /></td>
        <td className="px-4 py-3 text-[var(--text-secondary)]">R. Das</td>
    </tr>,
];

export default function ComponentShowcasePage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="space-y-6 bg-[var(--bg)] p-4 sm:p-6">
            <PageHeader
                title="Component Showcase"
                description="Shared light-theme system for BuilderDocs UI primitives. This page is a temporary preview and does not affect application logic."
                actions={
                    <>
                        <AppButton variant="secondary">
                            <Download className="h-4 w-4" />
                            Export
                        </AppButton>
                        <AppButton onClick={() => setModalOpen(true)}>
                            <Sparkles className="h-4 w-4" />
                            Preview modal
                        </AppButton>
                    </>
                }
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <PremiumCard className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Buttons</p>
                            <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">Action styles</h2>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <AppButton>Primary</AppButton>
                        <AppButton variant="secondary">Secondary</AppButton>
                        <AppButton variant="outline">Outline</AppButton>
                        <AppButton variant="ghost">Ghost</AppButton>
                        <AppButton variant="danger">Danger</AppButton>
                    </div>
                </PremiumCard>

                <PremiumCard className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">States</p>
                            <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">Status badges</h2>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <StatusPill label="Completed" tone="success" />
                        <StatusPill label="In review" tone="info" />
                        <StatusPill label="Pending" tone="warning" />
                        <StatusPill label="Blocked" tone="danger" />
                        <StatusPill label="Neutral" tone="neutral" />
                    </div>
                </PremiumCard>
            </div>

            <SectionCard title="Form controls" description="Shared input and selection states.">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Project name" required>
                        <TextInput placeholder="Enter a project name" defaultValue="Sunrise Residences" />
                    </Field>

                    <Field label="Search filters" error="This field is required if all filters are empty.">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                            <TextInput className="pl-9" placeholder="Search by customer or project" />
                        </div>
                    </Field>

                    <Field label="Category">
                        <Select defaultValue="residential">
                            <option value="residential">Residential</option>
                            <option value="commercial">Commercial</option>
                            <option value="civil">Civil works</option>
                        </Select>
                    </Field>

                    <Field label="Priority">
                        <Select defaultValue="high">
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                            <option value="low">Low</option>
                        </Select>
                    </Field>

                    <div className="md:col-span-2">
                        <Field label="Notes">
                            <TextArea rows={4} placeholder="Add any relevant notes or working instructions." />
                        </Field>
                    </div>

                    <div className="md:col-span-2 flex flex-wrap gap-6 pt-1">
                        <Checkbox label="Include tax calculation" defaultChecked />
                        <Checkbox label="Send update to customer" />
                        <Radio label="Standard billing" defaultChecked name="billing-mode" />
                        <Radio label="Priority booking" name="billing-mode" />
                    </div>
                </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <PremiumCard className="p-0">
                    <div className="border-b border-[var(--border)] px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Table</p>
                                <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">Project overview</h3>
                            </div>
                            <AppButton variant="outline" className="px-2.5 py-1.5 text-xs">
                                <FileText className="h-3.5 w-3.5" />
                                Export CSV
                            </AppButton>
                        </div>
                    </div>
                    <DataTable headers={tableHeaders} rows={tableRows} className="border-0 shadow-none" />
                </PremiumCard>

                <PremiumCard className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Tabs</p>
                    <div className="mt-3">
                        <TabList tabs={tabs} active={activeTab} onChange={setActiveTab} />
                    </div>
                    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                        <div className="flex items-center gap-2 text-[var(--text)]">
                            {activeTab === 'overview' && <BarChart3 className="h-4 w-4 text-[var(--primary)]" />}
                            {activeTab === 'quotes' && <FileText className="h-4 w-4 text-[var(--primary)]" />}
                            {activeTab === 'payments' && <ArrowRight className="h-4 w-4 text-[var(--primary)]" />}
                            <span className="font-medium">{tabs.find((tab) => tab.id === activeTab)?.label}</span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                            This tab pattern is reused across the BuilderDocs workspace to keep sections consistent and easy to scan.
                        </p>
                    </div>
                </PremiumCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <PremiumCard className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Skeletons</p>
                    <div className="mt-4 space-y-3">
                        <SkeletonRow className="h-4 w-2/3" />
                        <SkeletonRow className="h-4 w-1/2" />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <SkeletonRow className="h-20 w-full" />
                            <SkeletonRow className="h-20 w-full" />
                        </div>
                    </div>
                </PremiumCard>

                <EmptyState
                    icon={<Layers3 className="h-5 w-5" />}
                    title="No matching records"
                    description="Try changing your filters or create a new item to get started."
                    action={
                        <AppButton>
                            <Upload className="h-4 w-4" />
                            Create item
                        </AppButton>
                    }
                />
            </div>

            <PremiumCard className="p-5">
                <div className="flex items-center gap-2 text-[var(--text)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    <h3 className="text-lg font-semibold">Feedback and validation</h3>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--text-secondary)]">
                        <div className="mb-2 flex items-center gap-2 font-medium text-[var(--text)]">
                            <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                            Success feedback
                        </div>
                        A quotation was successfully saved and published.
                    </div>
                    <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-3 text-sm text-[var(--danger)]">
                        <div className="mb-2 flex items-center gap-2 font-medium">
                            <AlertCircle className="h-4 w-4" />
                            Validation warning
                        </div>
                        Please complete the required supplier details before syncing.
                    </div>
                </div>
            </PremiumCard>

            {modalOpen && (
                <Modal title="Component preview" eyebrow="Dialog" onClose={() => setModalOpen(false)} size="lg">
                    <div className="space-y-4">
                        <p className="text-sm leading-6 text-[var(--text-secondary)]">
                            This modal shell mirrors the shared BuilderDocs dialog pattern for forms, confirmations, and utility dialogs.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <AppButton>
                                <CheckCircle2 className="h-4 w-4" />
                                Confirm
                            </AppButton>
                            <AppButton variant="secondary">Cancel</AppButton>
                            <AppButton variant="danger">
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </AppButton>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
