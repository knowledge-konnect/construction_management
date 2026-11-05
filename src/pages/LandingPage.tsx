import BrandLogo from '@/components/BrandLogo';
import { AppButton, StatCard } from '@/components/ui/DesignSystem';
import {
  ArrowRight, BarChart3, CalendarClock, Check, CheckCircle2, ChevronDown, FileText, FolderKanban,
  IndianRupee, LayoutDashboard, Menu, PiggyBank, ReceiptText, Settings, Users, WalletCards, X,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ------------------------------ Content ------------------------------ */

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const features = [
  { icon: FolderKanban, title: 'Project Management', description: 'Create and organize projects from quotation flow or direct entry, then monitor progress across active jobs.' },
  { icon: FileText, title: 'Quotations and BOQ', description: 'Prepare itemized quotations with scope, rates, and structured BOQ-style details for customer-ready documents.' },
  { icon: ReceiptText, title: 'Booking Receipts', description: 'Generate and manage booking receipt workflows for apartment-style bookings with payment stage tracking.' },
  { icon: Users, title: 'Customer and Supplier Management', description: 'Maintain customer and supplier records once, then use them across quotations, projects, receipts, and payments.' },
  { icon: PiggyBank, title: 'Investor Management', description: 'Track investor records and contributions with visibility through dedicated investor and reporting views.' },
  { icon: WalletCards, title: 'Expenses and Payments', description: 'Record project expenses, customer receipts, and supplier payments to keep balances and obligations visible.' },
];

const businessTypes = [
  { title: 'Individual House Contractors', workflow: 'Create quotation, convert to project, track expenses and customer receipts, then review outstanding balances.' },
  { title: 'Apartment Developers', workflow: 'Manage project-level planning and use booking receipt workflows for unit bookings and payment stage tracking.' },
  { title: 'Civil Contractors', workflow: 'Handle multiple site projects, maintain supplier and material records, and monitor expense-heavy execution cycles.' },
  { title: 'Material Suppliers', workflow: 'Track customer-facing quotation and receipt activity, maintain party records, and review payment collections clearly.' },
];

const steps = [
  { step: '01', title: 'Set up your company and business information', description: 'Configure company profile details and base records so your quotation and project workflows start with clean data.' },
  { step: '02', title: 'Create quotations and projects', description: 'Prepare project quotations, then create projects directly from accepted opportunities or start projects directly.' },
  { step: '03', title: 'Track progress, expenses, and payments', description: 'Monitor execution progress, log project expenses, and record customer and supplier payment activity.' },
  { step: '04', title: 'Review financial reports and outstanding balances', description: 'Use dashboard and reports to review collections, expenses, and unpaid balances for informed decisions.' },
];

const financeBlindSpots = [
  'Customer receipt status not centralized',
  'Project expense entries spread across files',
  'Supplier outstanding dues missed',
  'Investor contribution tracking fragmented',
];

const financeSolutions = [
  'Customer payments received and pending balance visibility',
  'Project expenses recorded against active jobs',
  'Supplier payments and outstanding balances in one view',
  'Investor contributions and project financial performance in reports',
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

// Annual saves 5,988 - 4,999 = 989 (about 17%).
const PRO_MONTHLY = 499;
const PRO_ANNUAL = 4999;
const PRO_ANNUAL_SAVING = PRO_MONTHLY * 12 - PRO_ANNUAL;
const PRO_ANNUAL_PER_MONTH = Math.round(PRO_ANNUAL / 12);

const faqs = [
  { question: 'Which construction businesses can use BuilderDocs?', answer: 'BuilderDocs is built for individual house contractors, apartment developers, civil contractors, and teams that need centralized quotation, project, and finance tracking.' },
  { question: 'Can I track project expenses and payments?', answer: 'Yes. BuilderDocs supports project expense tracking, customer payment receipts, supplier payments, and outstanding-balance visibility.' },
  { question: 'Can I manage apartment bookings?', answer: 'Yes. The application includes booking receipt workflows with booking IDs, staged payments, and receipt documents.' },
  { question: 'Can I migrate existing data?', answer: 'There is no one-click migration wizard in the current app. Existing records can be moved in using your current process and then managed in BuilderDocs.' },
  { question: 'Is my company data secure?', answer: 'BuilderDocs keeps company data scoped by organization and user access through the existing authentication and company access controls.' },
];

const heroBenefits = ['Free plan', 'No credit card required', 'Quick setup'];

/* Static, read-only preview. All figures are illustrative sample data and are
   not connected to any real company, API, or financial calculation. */
const previewNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Quotations', icon: FileText },
  { label: 'Customers', icon: Users },
  { label: 'Expenses', icon: IndianRupee },
  { label: 'Payments', icon: ReceiptText },
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

const previewFinanceRows = [
  { label: 'Customer collections', value: '₹26.4L', tone: 'text-[#0F766E]' },
  { label: 'Project expenses', value: '₹21.6L', tone: 'text-[#17243A]' },
  { label: 'Supplier outstanding', value: '₹4.8L', tone: 'text-[#1D4ED8]' },
];

const previewStatusStyles: Record<string, string> = {
  'In progress': 'bg-[#EAF1FF] text-[#1D4ED8]',
  Completed: 'bg-[#ECFDF5] text-[#0F766E]',
  'On hold': 'bg-[#EEF2FF] text-[#3730A3]',
};

const previewTrend = [35, 55, 42, 68, 74, 61, 82];

/* --------------------------- Small helpers --------------------------- */

function SectionHead({ eyebrow, title }: { eyebrow: string; title: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold text-[#1D4ED8]">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-3xl font-bold tracking-[-0.04em] text-[#17243A] sm:text-4xl">{title}</h2>
    </div>
  );
}

function trendPaths(values: number[], w = 120, h = 40) {
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - (v / 100) * (h - 4) - 2] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return { line, area: `${line} L${w},${h} L0,${h} Z`, last: pts[pts.length - 1] };
}

/* ------------------------- Dashboard preview ------------------------- */

function DashboardPreviewCard() {
  const { line, area, last } = trendPaths(previewTrend);

  return (
    <div role="img" aria-label="Illustrative BuilderDocs dashboard preview with sample data" className="w-full">
      <div className="overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-[0_24px_56px_rgba(23,36,58,0.14)]">
        <div className="flex items-center gap-3 border-b border-[#E6E8EC] bg-[#F8FAFC] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F8B4B4]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FCD9A0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#A7E3C4]" />
          </div>
          <div className="mx-auto max-w-[16rem] flex-1 truncate rounded-md border border-[#E6E8EC] bg-white px-3 py-1 text-center text-[11px] font-medium text-[#667085]">
            app.builderdocs.in/dashboard
          </div>
          <span className="w-12 shrink-0 max-sm:hidden" aria-hidden />
        </div>

        <div className="flex">
          <aside className="hidden w-36 shrink-0 flex-col gap-1 bg-[#17243A] p-3 md:flex">
            <p className="px-2.5 pb-2 pt-1 text-[11px] font-semibold text-[#93B4F5]">Workspace</p>
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
              <span className="shrink-0 rounded-full border border-[#E6E8EC] bg-white px-2.5 py-1 text-[11px] font-medium text-[#667085]">Sample data</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {previewMetrics.map(({ label, value, icon: Icon, tone }) => (
                <StatCard key={label} label={label} value={value} icon={<Icon className="h-3.5 w-3.5" />} iconTone={tone} compact className="p-3" />
              ))}
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <div className="rounded-xl border border-[#E6E8EC] bg-white p-4">
                <p className="text-sm font-semibold text-[#17243A]">Recent projects</p>
                <div className="mt-3 space-y-3">
                  {previewProjects.map((project) => (
                    <div key={project.name}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-medium text-[#17243A]">{project.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${previewStatusStyles[project.status]}`}>{project.status}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E6E8EC]">
                          <div className={`h-full rounded-full ${project.status === 'Completed' ? 'bg-[#0F766E]' : 'bg-[#1D4ED8]'}`} style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-[#667085]">{project.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E6E8EC] bg-white p-4">
                <p className="text-sm font-semibold text-[#17243A]">Finance snapshot</p>
                <div className="mt-3 space-y-2">
                  {previewFinanceRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2 rounded-lg border border-[#EEF2F6] bg-[#F8FAFC] px-3 py-2">
                      <p className="min-w-0 truncate text-[11px] font-medium text-[#667085]">{row.label}</p>
                      <p className={`shrink-0 text-sm font-semibold tabular-nums ${row.tone}`}>{row.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-[#E6E8EC] px-3 py-2.5">
                  <p className="text-[11px] font-medium text-[#667085]">Collection trend</p>
                  <svg viewBox="0 0 120 40" className="mt-1.5 h-10 w-full" preserveAspectRatio="none" aria-hidden>
                    <defs>
                      <linearGradient id="bd-trend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={area} fill="url(#bd-trend)" />
                    <path d={line} fill="none" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    <circle cx={last[0]} cy={last[1]} r="2.4" fill="#1D4ED8" stroke="#fff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Page -------------------------------- */

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [annual, setAnnual] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    navItems.forEach((n) => {
      const el = document.querySelector(n.href);
      if (el) io.observe(el);
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  const goToSignup = () => navigate('/login?mode=register');
  const goToLogin = () => navigate('/login');

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#17243A]">
      <header className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl transition-shadow ${scrolled ? 'border-[#E6E8EC] shadow-[0_6px_24px_rgba(23,36,58,0.06)]' : 'border-transparent'}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('/')} className="text-left" aria-label="BuilderDocs home">
            <BrandLogo size="sm" onDark={false} />
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.href)}
                className={`relative py-1 text-sm font-medium transition hover:text-[#17243A] ${active === item.href ? 'text-[#17243A]' : 'text-[#475467]'}`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 rounded-full bg-[#1D4ED8] transition-all duration-200 ${active === item.href ? 'w-full' : 'w-0'}`} />
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <AppButton variant="secondary" onClick={goToLogin} className="border-[#E6E8EC] px-4 py-2.5 text-sm">Sign In</AppButton>
            <AppButton onClick={goToSignup} className="px-4 py-2.5 text-sm">Get Started Free</AppButton>
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
                <AppButton variant="secondary" onClick={goToLogin} className="w-full justify-center">Sign In</AppButton>
                <AppButton onClick={goToSignup} className="w-full justify-center">Get Started Free</AppButton>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F5F8FF_65%,#F5F7FA_100%)]">
          <div className="bd-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:px-8 lg:py-16">
            <div className="min-w-0">
              <div className="bd-rise inline-flex items-center gap-2 rounded-full border border-[#D9E7FF] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1D4ED8] opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1D4ED8]" />
                </span>
                Construction business management
              </div>

              <h1 className="bd-rise bd-d1 mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#17243A] sm:text-5xl xl:text-6xl">
                <span className="block">Build Better.</span>
                <span className="block text-[#1D4ED8]">Manage Smarter.</span>
              </h1>

              <p className="bd-rise bd-d2 mt-4 text-xl font-semibold tracking-[-0.02em] text-[#17243A] sm:text-2xl">Your entire construction business. One workspace.</p>

              <p className="bd-rise bd-d2 mt-4 max-w-xl text-base leading-7 text-[#475467] sm:text-lg">
                Manage projects, quotations, customers, suppliers, expenses and payments from one centralized platform.
              </p>

              <div className="bd-rise bd-d3 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <AppButton onClick={goToSignup} className="group w-full px-6 py-3.5 text-sm sm:w-auto">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </AppButton>
                <AppButton variant="secondary" onClick={() => scrollToSection('#pricing')} className="w-full px-6 py-3.5 text-sm sm:w-auto">
                  View Pricing
                </AppButton>
              </div>

              <ul className="bd-rise bd-d3 mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {heroBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm text-[#475467]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0F766E]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bd-rise bd-d4 relative min-w-0">
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_center,rgba(29,78,216,0.12),transparent_68%)] blur-2xl" />
              <DashboardPreviewCard />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-[#F5F7FA] py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="Features" title="Everything you need to run your construction business" />

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-[#E6E8EC] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#1D4ED8]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#17243A]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#475467]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Business types */}
        <section className="border-y border-[#E6E8EC] bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="Built for your construction business" title="Workflows for real construction teams" />

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {businessTypes.map(({ title, workflow }) => (
                <div key={title} className="rounded-2xl border border-[#E6E8EC] bg-[#F8FAFC] p-5">
                  <h3 className="text-lg font-semibold text-[#17243A]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#475467]">{workflow}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-[#F5F7FA] py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="How it works" title="From quotation to project completion" />

            <div className="relative mt-10">
              <div className="absolute left-0 right-0 top-[22px] hidden h-px bg-[linear-gradient(90deg,transparent,#D9E7FF_10%,#D9E7FF_90%,transparent)] xl:block" aria-hidden />
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                {steps.map(({ step, title, description }) => (
                  <div key={step} className="relative">
                    <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#D9E7FF] bg-white text-sm font-bold text-[#1D4ED8] shadow-sm">
                      {step}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-snug text-[#17243A]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#475467]">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Financial visibility */}
        <section className="border-y border-[#E6E8EC] bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="Financial visibility" title="Know where every rupee is moving" />

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#E6E8EC] bg-white p-6">
                <p className="text-sm font-semibold text-[#667085]">Financial blind spots</p>
                <ul className="mt-5 space-y-4">
                  {financeBlindSpots.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-sm text-[#475467]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[#B91C1C]">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border-2 border-[#D9E7FF] bg-[#F8FBFF] p-6">
                <p className="text-sm font-semibold text-[#1D4ED8]">BuilderDocs financial view</p>
                <ul className="mt-5 space-y-4">
                  {financeSolutions.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-sm text-[#17243A]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534]">
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

        {/* Pricing */}
        <section id="pricing" className="bg-[#F5F7FA] py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="Pricing" title="Simple, transparent plans." />

            <div className="mt-6 flex justify-center">
              <div role="group" aria-label="Billing period" className="inline-flex rounded-full border border-[#E6E8EC] bg-white p-1 text-sm font-medium">
                {[{ k: false, l: 'Monthly' }, { k: true, l: 'Annual' }].map(({ k, l }) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={annual === k}
                    onClick={() => setAnnual(k)}
                    className={`rounded-full px-4 py-1.5 transition ${annual === k ? 'bg-[#1D4ED8] text-white' : 'text-[#475467] hover:text-[#17243A]'}`}
                  >
                    {l}
                    {k && (
                      <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${annual ? 'bg-white/20 text-white' : 'bg-[#ECFDF5] text-[#0F766E]'}`}>
                        Save 17%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-3xl border border-[#E6E8EC] bg-white p-8">
                <p className="text-sm font-semibold text-[#667085]">Free</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#17243A]">₹0</span>
                  <span className="text-sm text-[#667085]">/ month</span>
                </div>
                <p className="mt-2 h-5 text-xs text-[#667085]">For trying quotations before you upgrade</p>

                <ul className="mt-6 space-y-3">
                  {freePlanFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#475467]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <AppButton variant="secondary" onClick={goToSignup} className="mt-auto w-full justify-center">Get Started Free</AppButton>
              </div>

              <div className="flex flex-col rounded-3xl border-2 border-[#D9E7FF] bg-white p-8 shadow-[0_18px_42px_rgba(29,78,216,0.12)]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-[#1D4ED8]">Pro</p>
                  <span className="rounded-full bg-[#EAF1FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">Recommended</span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums text-[#17243A]">₹{(annual ? PRO_ANNUAL : PRO_MONTHLY).toLocaleString('en-IN')}</span>
                  <span className="text-sm text-[#667085]">/ {annual ? 'year' : 'month'}</span>
                </div>
                <p className={`mt-2 h-5 text-xs ${annual ? 'text-[#0F766E]' : 'text-[#667085]'}`}>
                  {annual
                    ? `About ₹${PRO_ANNUAL_PER_MONTH} a month. You save ₹${PRO_ANNUAL_SAVING}.`
                    : `Or ₹${PRO_ANNUAL.toLocaleString('en-IN')} / year with annual billing`}
                </p>

                <ul className="mt-6 space-y-3">
                  {proPlanFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#475467]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
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

        {/* FAQ */}
        <section id="faq" className="border-t border-[#E6E8EC] bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="FAQ" title="Everything you need to know" />

            <div className="mt-8 overflow-hidden rounded-2xl border border-[#E6E8EC] bg-white">
              {faqs.map(({ question, answer }, index) => {
                const isOpen = openFaq === index;

                return (
                  <div key={question} className={`border-b border-[#E6E8EC] transition-colors last:border-none ${isOpen ? 'bg-[#F8FAFC]' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                    >
                      <span className="text-base font-medium text-[#17243A]">{question}</span>
                      <ChevronDown className={`h-5 w-5 shrink-0 text-[#475467] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div
                      id={`faq-panel-${index}`}
                      role="region"
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-6 text-[#475467] sm:px-6">{answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative overflow-hidden bg-[#17243A] py-14 text-white sm:py-16">
          <div className="bd-grid absolute inset-0 opacity-40 [filter:invert(1)_brightness(2)]" aria-hidden />
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#1D4ED8]/30 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-balance text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Build Better. Manage Smarter.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
              Bring your quotations, projects, expenses, and payment tracking into one organized workspace.
            </p>
            <AppButton onClick={goToSignup} className="group mt-7 bg-[#1D4ED8] px-6 py-3.5 text-sm hover:bg-[#1E40AF]">
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </AppButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E6E8EC] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <BrandLogo size="sm" onDark={false} />
            <div className="mt-1 text-xs text-[#667085]">Construction business management</div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-[#475467]">
            {navItems.map((item) => (
              <button key={item.label} type="button" onClick={() => scrollToSection(item.href)} className="transition hover:text-[#17243A]">
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5 text-sm text-[#475467]">
            <button type="button" onClick={goToLogin} className="transition hover:text-[#17243A]">Sign In</button>
            <button type="button" onClick={goToSignup} className="transition hover:text-[#17243A]">Get Started</button>
          </div>
        </div>
        <div className="border-t border-[#E6E8EC] py-4 text-center text-xs text-[#667085]">
          © {new Date().getFullYear()} BuilderDocs. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
