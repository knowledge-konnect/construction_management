import Logo from '@/components/Logo';
import { AppButton, StatCard } from '@/components/ui/DesignSystem';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  FolderKanban,
  IndianRupee,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const features = [
  {
    icon: FileText,
    title: 'Professional Quotations',
    description: 'Itemized estimates, project-specific terms, and branded document output for customer-ready quotations.',
  },
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Create projects directly or from accepted quotations and track progress across active jobs.',
  },
  {
    icon: WalletCards,
    title: 'Expense Tracking',
    description: 'Organize project spending, review costs, and keep financial records in one place.',
  },
  {
    icon: IndianRupee,
    title: 'Supplier Payments',
    description: 'Track supplier bills, payments, and outstanding balances without losing visibility into obligations.',
  },
  {
    icon: ReceiptText,
    title: 'Payments Received',
    description: 'Record receipts and monitor customer payments against project balances.',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports',
    description: 'Review project costs, collections, and outstanding amounts from the reports workspace.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Set up your business and customers',
    description: 'Define your company setup, customer details, and project context before creating formal documents.',
  },
  {
    step: '02',
    title: 'Create a quotation or start a project',
    description: 'Use the quotation flow or jump directly into project creation to move opportunities forward.',
  },
  {
    step: '03',
    title: 'Track progress, expenses, and payments',
    description: 'Monitor active work, record supplier costs, and keep customer payments tied to the right projects.',
  },
  {
    step: '04',
    title: 'Review reports and outstanding balances',
    description: 'Use the dashboard and report views to understand project performance and financial status.',
  },
];

const freePlanFeatures = [
  'Up to 3 quotations per month',
  'Essential quotation creation and calculations',
  'Customer and quotation management',
  'Standard quotation documents',
];

const proPlanFeatures = [
  'Unlimited quotation usage once your paid plan is active',
  'Project management and progress tracking',
  'Expense and supplier payment tracking',
  'Customer receipt and payment tracking',
  'Financial reports and outstanding-balance visibility',
  'Company branding and document support in the app',
];

const faqs = [
  {
    question: 'What does BuilderDocs do?',
    answer: 'BuilderDocs helps construction businesses manage quotations, project records, expenses, supplier payments, customer receipts, and financial reporting in one workspace.',
  },
  {
    question: 'Can I create projects without a quotation?',
    answer: 'Yes. The app supports direct project creation alongside the quotation flow, so you can start work without first generating a quotation.',
  },
  {
    question: 'Can I track expenses and payments?',
    answer: 'Yes. The app includes expense tracking, supplier-bill management, and customer payment tracking so financial activity stays connected to ongoing projects.',
  },
  {
    question: 'How do I review project costs and collections?',
    answer: 'Use the dashboard and reports pages to review project values, supplier costs, customer receipts, and outstanding balances.',
  },
  {
    question: 'What are the plan limits?',
    answer: 'The free plan allows up to 3 quotations in a calendar month. Paid plans remove that limit and unlock broader project and finance workflows.',
  },
  {
    question: 'Does BuilderDocs support team access?',
    answer: 'The application includes team and settings workflows, and permissions are managed through the existing app logic rather than the landing page itself.',
  },
  {
    question: 'Can I upgrade to annual billing?',
    answer: 'Yes. The current billing implementation supports both monthly and yearly subscriptions, and the yearly Pro option is shown as ₹4,999 / year.',
  },
];

const trustPoints = ['Project visibility', 'Expense control', 'Payment tracking', 'Financial reporting'];

const heroBenefits = ['Free plan', 'No credit card required', 'Quick setup'];

// Static, read-only preview. All figures are illustrative sample data and are
// not connected to any real company, API, or financial calculation.
const previewNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Quotations', icon: FileText },
  { label: 'Customers', icon: Users },
  { label: 'Expenses', icon: IndianRupee },
  { label: 'Payments Received', icon: ReceiptText },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

const previewMetrics = [
  { label: 'Projects', value: '24', icon: FolderKanban, tone: 'bg-[#EAF1FF] text-[#1D4ED8]' },
  { label: 'Active', value: '18', icon: CalendarClock, tone: 'bg-[#EAF1FF] text-[#1D4ED8]' },
  { label: 'Contract value', value: '₹48.2L', icon: IndianRupee, tone: 'bg-[#ECFDF5] text-[#0F766E]' },
  { label: 'Supplier cost', value: '₹21.6L', icon: WalletCards, tone: 'bg-[#ECFDF5] text-[#0F766E]' },
];

const previewProjects = [
  { name: 'Green Valley Residency', progress: 72, status: 'In progress' },
  { name: 'City Plaza Commercial', progress: 48, status: 'In progress' },
  { name: 'Lakeview Villas', progress: 100, status: 'Completed' },
  { name: 'Office Renovation', progress: 35, status: 'On hold' },
];

const previewStatusStyles: Record<string, string> = {
  'In progress': 'bg-[#EAF1FF] text-[#1D4ED8]',
  Completed: 'bg-[#ECFDF5] text-[#0F766E]',
  'On hold': 'bg-amber-50 text-amber-700',
};

function DashboardPreviewCard() {
  return (
    <div role="img" aria-label="Illustrative BuilderDocs dashboard preview with sample data" className="w-full">
      <div className="overflow-hidden rounded-2xl border border-[#E6E8EC] bg-white shadow-[0_24px_60px_rgba(23,36,58,0.12)]">
        <div className="flex">
          <aside className="hidden w-36 shrink-0 flex-col gap-1 bg-[#17243A] p-3 sm:flex xl:w-40">
            <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93B4F5]">Workspace</p>
            {previewNav.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${active ? 'bg-[#1D4ED8] text-white' : 'text-slate-300'}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </aside>

          <div className="min-w-0 flex-1 bg-[#F8FAFC] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[#17243A]">Dashboard</p>
                <p className="text-xs text-[#667085]">Workspace overview</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#E6E8EC] bg-white px-2.5 py-1 text-[11px] font-medium text-[#667085]">
                Sample data
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {previewMetrics.map(({ label, value, icon: Icon, tone }) => (
                <StatCard
                  key={label}
                  label={label}
                  value={value}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  iconTone={tone}
                  compact
                  className="p-3"
                />
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-white p-4">
              <p className="text-sm font-semibold text-[#17243A]">Recent projects</p>
              <div className="mt-3 space-y-3">
                {previewProjects.map((project) => (
                  <div key={project.name}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-xs font-medium text-[#17243A]">{project.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${previewStatusStyles[project.status]}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-[#E6E8EC]">
                        <div
                          className={`h-1.5 rounded-full ${project.status === 'Completed' ? 'bg-[#0F766E]' : 'bg-[#1D4ED8]'}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[11px] text-[#667085]">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-3 -mt-4 grid grid-cols-2 gap-3 sm:mx-6">
        <div className="min-w-0 rounded-xl border border-[#E6E8EC] bg-white p-3 shadow-[0_12px_28px_rgba(23,36,58,0.10)]">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#667085]">
            <ReceiptText className="h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
            <span className="truncate">Payments received</span>
          </div>
          <p className="mt-1.5 text-lg font-semibold text-[#17243A]">₹26.4L</p>
          <p className="truncate text-[11px] text-[#667085]">Receipts received</p>
        </div>
        <div className="min-w-0 rounded-xl border border-[#E6E8EC] bg-white p-3 shadow-[0_12px_28px_rgba(23,36,58,0.10)]">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#667085]">
            <WalletCards className="h-3.5 w-3.5 shrink-0 text-[#1D4ED8]" />
            <span className="truncate">Supplier outstanding</span>
          </div>
          <p className="mt-1.5 text-lg font-semibold text-[#17243A]">₹4.8L</p>
          <p className="truncate text-[11px] text-[#667085]">Unpaid supplier balance</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goToSignup = () => navigate('/login?mode=register');
  const goToLogin = () => navigate('/login');

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#17243A]">
      <header className="sticky top-0 z-40 border-b border-[#E6E8EC] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('/')} className="text-left" aria-label="BuilderDocs home">
            <Logo size="sm" onDark={false} />
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.href)}
                className="text-sm font-medium text-[#475467] transition hover:text-[#17243A]"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <AppButton variant="secondary" onClick={goToLogin} className="border-[#E6E8EC] px-4 py-2.5 text-sm">
              Sign In
            </AppButton>
            <AppButton onClick={goToSignup} className="px-4 py-2.5 text-sm">
              Get Started Free
            </AppButton>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6E8EC] bg-white text-[#17243A] lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#E6E8EC] bg-white lg:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:px-6" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => scrollToSection(item.href)}
                  className="rounded-xl px-3 py-2 text-left text-sm font-medium text-[#475467] transition hover:bg-[#F5F7FA] hover:text-[#17243A]"
                >
                  {item.label}
                </button>
              ))}
              <div className="mt-2 grid gap-2 pt-2">
                <AppButton variant="secondary" onClick={goToLogin} className="w-full justify-center">
                  Sign In
                </AppButton>
                <AppButton onClick={goToSignup} className="w-full justify-center">
                  Get Started Free
                </AppButton>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F5F8FF_65%,#F5F7FA_100%)]">
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:px-8 lg:py-20">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-[#D9E7FF] bg-[#EEF4FF] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                Construction Business Management
              </div>

              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#17243A] sm:text-5xl xl:text-6xl">
                <span className="block">Your projects.</span>
                <span className="block">Your finances.</span>
                <span className="block text-[#1D4ED8]">One place.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-[#475467] sm:text-lg">
                Manage construction quotations, projects, expenses, supplier payments and customer receipts — all from one workspace.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <AppButton onClick={goToSignup} className="w-full px-6 py-3.5 text-sm sm:w-auto">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </AppButton>
                <AppButton variant="secondary" onClick={() => scrollToSection('#pricing')} className="w-full px-6 py-3.5 text-sm sm:w-auto">
                  View Pricing
                </AppButton>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {heroBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm text-[#475467]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0F766E]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative min-w-0">
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_center,rgba(29,78,216,0.14),transparent_68%)] blur-2xl" />
              <DashboardPreviewCard />
            </div>
          </div>
        </section>

        <section className="border-y border-[#E6E8EC] bg-white/80 py-6 sm:py-7">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-2 text-sm font-medium text-[#475467]">
                  <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-[#F5F7FA] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1D4ED8]">Features</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#17243A] sm:text-4xl">
                Everything You Need to Manage Construction Projects
              </h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-[#E6E8EC] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#1D4ED8]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#17243A]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#475467]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-[#F5F7FA] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1D4ED8]">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#17243A] sm:text-4xl">From Quotation to Project Completion</h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {steps.map(({ step, title, description }) => (
                <div key={step} className="rounded-2xl border border-[#E6E8EC] bg-white p-6 shadow-[0_8px_22px_rgba(15,23,42,0.03)]">
                  <div className="inline-flex rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">{step}</div>
                  <h3 className="mt-4 text-xl font-semibold text-[#17243A]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#475467]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1D4ED8]">Why BuilderDocs</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#17243A] sm:text-4xl">Less Spreadsheet Work. More Control.</h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#E6E8EC] bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#667085]">Manual process</p>
                <ul className="mt-6 space-y-4">
                  {['Disconnected files', 'Duplicate data entry', 'Unclear customer status', 'Missed payment follow-ups'].map((point) => (
                    <li key={point} className="flex items-center gap-3 text-sm text-[#475467]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FEE2E2] text-[#B91C1C]">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border-2 border-[#D9E7FF] bg-[#F8FBFF] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">BuilderDocs workflow</p>
                <ul className="mt-6 space-y-4">
                  {['Quotes, projects, and costs in one place', 'Real-time project visibility', 'Supplier and customer payment tracking', 'Decision-ready reporting'].map((point) => (
                    <li key={point} className="flex items-center gap-3 text-sm text-[#17243A]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#F5F7FA] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1D4ED8]">Pricing</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#17243A] sm:text-4xl">Simple, transparent plans.</h2>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-[#E6E8EC] bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#667085]">Free</p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#17243A]">₹0</span>
                  <span className="text-sm text-[#667085]">/ month</span>
                </div>

                <ul className="mt-7 space-y-3">
                  {freePlanFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#475467]">
                      <Check className="mt-0.5 h-4 w-4 text-[#0F766E]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <AppButton variant="secondary" onClick={goToSignup} className="mt-8 w-full justify-center">
                  Get Started Free
                </AppButton>
              </div>

              <div className="rounded-3xl border-2 border-[#D9E7FF] bg-white p-8 shadow-[0_18px_42px_rgba(29,78,216,0.12)]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">Pro</p>
                  <span className="rounded-full bg-[#EAF1FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                    Recommended
                  </span>
                </div>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#17243A]">₹499</span>
                  <span className="text-sm text-[#667085]">/ month</span>
                </div>

                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F5F7FA] px-3 py-1.5 text-xs text-[#475467]">
                  <IndianRupee className="h-3.5 w-3.5 text-[#1D4ED8]" />
                  Annual Pro: ₹4,999 / year
                </div>

                <ul className="mt-7 space-y-3">
                  {proPlanFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#475467]">
                      <Check className="mt-0.5 h-4 w-4 text-[#0F766E]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <AppButton onClick={goToSignup} className="mt-8 w-full justify-center shadow-[0_12px_20px_rgba(29,78,216,0.16)]">
                  Upgrade to BuilderDocs
                </AppButton>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1D4ED8]">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#17243A] sm:text-4xl">Everything you need to know</h2>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-[#E6E8EC] bg-white">
            {faqs.map(({ question, answer }, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={question} className={`border-b border-[#E6E8EC] last:border-none ${isOpen ? 'bg-[#F8FAFC]' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                  >
                    <span className="text-base font-medium text-[#17243A]">{question}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-[#475467] transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div id={`faq-panel-${index}`} className="px-5 pb-5 text-sm leading-6 text-[#475467] sm:px-6">
                      {answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-[#17243A] py-20 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Build Better. Manage Smarter.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
              Bring your quotations, projects, expenses, and payment tracking into one organized workspace.
            </p>
            <AppButton onClick={goToSignup} className="mt-8 px-6 py-3.5 text-sm bg-[#1D4ED8] hover:bg-[#1E40AF]">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </AppButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E6E8EC] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Logo variant="mark" size="sm" onDark={false} />
            <div>
              <div className="text-base font-bold text-[#17243A]">BuilderDocs</div>
              <div className="text-xs text-[#667085]">Construction business management</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-[#475467]">
            <button type="button" onClick={() => scrollToSection('#features')} className="transition hover:text-[#17243A]">Features</button>
            <button type="button" onClick={() => scrollToSection('#how-it-works')} className="transition hover:text-[#17243A]">How It Works</button>
            <button type="button" onClick={() => scrollToSection('#pricing')} className="transition hover:text-[#17243A]">Pricing</button>
            <button type="button" onClick={() => scrollToSection('#faq')} className="transition hover:text-[#17243A]">FAQ</button>
          </div>

          <div className="flex items-center gap-5 text-sm text-[#475467]">
            <button type="button" onClick={goToLogin} className="transition hover:text-[#17243A]">Sign In</button>
            <button type="button" onClick={goToSignup} className="transition hover:text-[#17243A]">Get Started</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
