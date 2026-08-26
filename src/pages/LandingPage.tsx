import Logo from '@/components/Logo';
import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Files,
  Receipt,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: FileText,
    title: 'Professional Quotations',
    description: 'Create detailed quotations with BOQ, specifications, inclusions, exclusions and commercial terms.',
  },
  {
    icon: Calculator,
    title: 'Automatic Calculations',
    description: 'Quantity \u00d7 rate calculations, subtotals, taxes and totals are calculated automatically.',
  },
  {
    icon: ClipboardList,
    title: 'Payment Schedules',
    description: 'Define milestone-based payment stages and include them clearly in every quotation.',
  },
  {
    icon: Files,
    title: 'Professional PDF Documents',
    description: 'Generate clean, branded PDFs that are ready to share with your customers.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Save customer details once and reuse them across future quotations.',
  },
  {
    icon: ShieldCheck,
    title: 'Your Data, Isolated',
    description: 'Each company\u2019s customers, quotations and settings remain securely separated.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Set up your company',
    description: 'Add your company details, logo and business information once.',
  },
  {
    step: '02',
    title: 'Build your quotation',
    description: 'Add project details, BOQ, specifications, payment schedules and terms.',
  },
  {
    step: '03',
    title: 'Share a professional PDF',
    description: 'Preview, download and send a branded quotation to your customer.',
  },
];

const EXCEL_POINTS = ['Manual calculations', 'Repeated data entry', 'Manual formatting', 'Scattered files'];
const BUILDERDOCS_POINTS = ['Automatic calculations', 'Reusable customer details', 'Branded PDFs', 'Cloud-backed documents'];

const FREE_FEATURES = [
  '3 quotations per month',
  'All quotation features',
  'BOQ',
  'Specifications',
  'Payment schedules',
  'Professional PDF generation',
  'Customer management',
  'Company branding',
  'Cloud storage',
];

const PAID_FEATURES = [
  'Unlimited quotations',
  'All features included',
  'BOQ',
  'Specifications',
  'Payment schedules',
  'Professional PDF generation',
  'Customer management',
  'Company branding',
  'Cloud storage',
  'Multiple users',
];

const FAQS = [
  {
    q: 'Is the free plan really free?',
    a: 'Yes. You can create up to 3 quotations every month without paying.',
  },
  {
    q: 'What happens when I reach 3 quotations?',
    a: 'You can continue viewing and managing your existing quotations. Upgrade to create unlimited new quotations.',
  },
  {
    q: 'Are all features available on the free plan?',
    a: 'Yes. The free plan includes the same core features. The paid plan removes the quotation limit.',
  },
  {
    q: 'Can I use my company logo and details?',
    a: 'Yes. Add your company branding and business details to create professional documents.',
  },
  {
    q: 'Can I switch to yearly billing?',
    a: 'Yes. Choose the annual BuilderDocs plan for \u20b93,499/year.',
  },
];

// A genuine illustration of the actual BOQ table structure BuilderDocs
// generates on every quotation PDF (same column headers as src/lib/pdf.ts:
// S.No / Description / Qty / Unit / Rate / Amount) — not a screenshot claim,
// just a concrete visual of what the output looks like.
function QuotationPreviewCard() {
  const rows = [
    { no: 1, desc: 'Excavation & earthwork', qty: '1200', unit: 'sq.ft', rate: '18', amount: '21,600' },
    { no: 2, desc: 'RCC footing & column work', qty: '1', unit: 'LS', rate: '2,85,000', amount: '2,85,000' },
    { no: 3, desc: 'Brickwork — 9" thick', qty: '4,600', unit: 'sq.ft', rate: '95', amount: '4,37,000' },
  ];
  return (
    <div className="bg-white rounded-xl shadow-2xl shadow-black/30 w-full max-w-md mx-auto overflow-hidden">
      <div className="bg-[#0B2857] px-5 py-4 flex items-center justify-between">
        <div>
          <div className="h-2.5 w-24 bg-white/70 rounded-full mb-2" />
          <div className="h-2 w-32 bg-white/30 rounded-full" />
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#F4B72B] font-semibold tracking-wide">QUOTATION</div>
          <div className="text-xs text-white/80">QTN/2026/014</div>
        </div>
      </div>
      <div className="px-5 py-4">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100">
              <th className="text-left font-medium pb-2 pr-2">S.No</th>
              <th className="text-left font-medium pb-2 pr-2">Description</th>
              <th className="text-right font-medium pb-2 pr-2">Qty</th>
              <th className="text-right font-medium pb-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no} className="border-b border-slate-50">
                <td className="py-2 pr-2 text-slate-400">{r.no}</td>
                <td className="py-2 pr-2 text-slate-700">{r.desc}</td>
                <td className="py-2 pr-2 text-right text-slate-500">{r.qty} {r.unit}</td>
                <td className="py-2 text-right text-slate-700 font-medium">₹{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Grand Total</span>
          <span className="text-sm font-bold text-[#0B2857]">₹7,43,600</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const goToSignup = () => navigate('/login?mode=register');

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="bg-[#071C3F] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-white hover:text-[#F4B72B] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={goToSignup}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#071C3F] bg-[#F4B72B] hover:bg-[#e0a520] rounded-lg transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#071C3F] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F4B72B 0, #F4B72B 1px, transparent 1px, transparent 30px)' }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-16 sm:pt-20 sm:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F4B72B]/30 bg-[#F4B72B]/10 px-3 py-1 mb-5">
              <Rocket className="w-3.5 h-3.5 text-[#F4B72B]" />
              <span className="text-xs font-medium text-[#F4B72B]">Now onboarding early access users</span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F4B72B] mb-4">
              For Builders &amp; Contractors
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
              Create professional construction quotations in minutes.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0">
              Build BOQs, payment schedules, customer details and branded PDFs — without Excel or manual formatting.
            </p>
            <p className="mt-3 text-sm font-medium text-[#F4B72B]">
              Start free with 3 quotations every month.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <button
                onClick={goToSignup}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#071C3F] bg-[#F4B72B] hover:bg-[#e0a520] rounded-lg shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
          <div>
            <QuotationPreviewCard />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B234A]">Everything you need to create professional quotations</h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            From BOQ to branded PDF — everything is organized in one simple workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-lg bg-[#0B2857]/5 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#0B2857]" />
              </div>
              <h3 className="text-base font-semibold text-[#0B234A] mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why BuilderDocs */}
      <section className="bg-[#F7F9FC] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B234A]">Stop building quotations in Excel</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Replace spreadsheets, manual calculations and repetitive formatting with one simple quotation workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">Excel + Word</h3>
              <ul className="space-y-3">
                {EXCEL_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <X className="w-4 h-4 text-red-400 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border-2 border-[#0B2857]/15 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#0B2857] mb-4">BuilderDocs</h3>
              <ul className="space-y-3">
                {BUILDERDOCS_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B234A]">How it works</h2>
            <p className="mt-3 text-slate-500">Three steps from company setup to a shared PDF.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, description }) => (
              <div key={step}>
                <div className="text-3xl font-bold text-[#F4B72B] mb-3">{step}</div>
                <h3 className="text-base font-semibold text-[#0B234A] mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
          {[
            'Company-isolated data',
            'Role-based team access',
            'Branded, downloadable PDFs',
            'Payment schedule tracking',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0B2857]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#F7F9FC] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B234A]">Simple pricing. Start free.</h2>
            <p className="mt-3 text-slate-500">Try BuilderDocs with no credit card. Upgrade only when you need unlimited quotations.</p>
          </div>
          <div className="flex items-center justify-center gap-2 mb-10">
            <Sparkles className="w-4 h-4 text-[#0B2857]" />
            <p className="text-sm font-medium text-[#0B2857]">One plan. All features. No complicated tiers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {/* Free */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7">
              <h3 className="text-base font-semibold text-[#0B234A]">Free</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-[#0B234A]">₹0</span>
                <span className="text-sm text-slate-400">Forever</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToSignup}
                className="mt-7 w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#0B2857] bg-white border-2 border-[#0B2857] hover:bg-[#0B2857]/5 rounded-lg transition-colors"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Paid */}
            <div className="relative bg-white border-2 border-[#F4B72B] rounded-2xl p-7 shadow-lg shadow-[#F4B72B]/10">
              <span className="absolute -top-3 left-7 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#071C3F] bg-[#F4B72B] rounded-full">
                Recommended
              </span>
              <h3 className="text-base font-semibold text-[#0B234A]">BuilderDocs</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-[#0B234A]">₹349</span>
                <span className="text-sm text-slate-400">/ month</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#0B2857]">₹3,499/year</span>
                <span className="text-slate-400">Save ₹689 compared with monthly billing.</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {PAID_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToSignup}
                className="mt-7 w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#071C3F] bg-[#F4B72B] hover:bg-[#e0a520] rounded-lg shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5"
              >
                Upgrade to BuilderDocs <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 max-w-xl mx-auto text-center bg-[#0B2857]/5 border border-[#0B2857]/10 rounded-xl px-5 py-4">
            <p className="text-sm text-[#0B2857]">
              Start free — create up to 3 quotations every month. Upgrade when you need unlimited quotations.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B234A]">Common questions</h2>
        </div>
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="p-5">
              <h3 className="text-sm font-semibold text-[#0B234A] mb-1.5">{q}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0B2857]">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to create your next quotation?</h2>
          <p className="mt-3 text-slate-300">Start free with 3 quotations every month. Upgrade only when you need more.</p>
          <button
            onClick={goToSignup}
            className="mt-7 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#071C3F] bg-[#F4B72B] hover:bg-[#e0a520] rounded-lg shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#071C3F]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <div>
              <div>BuilderDocs v1.0</div>
              <div className="text-xs text-slate-500">Simple quotation &amp; document management for builders and contractors.</div>
            </div>
          </div>
          <span>&copy; {new Date().getFullYear()} BuilderDocs. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
