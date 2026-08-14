import { useBuilder } from '@/context/BuilderContext';
import { useCompany } from '@/context/CompanyContext';
import {
  amountToWords,
  calcBOQSubtotal,
  calcCommercial, calcItemAmount,
  calcPaymentAmount, calcPaymentPercentTotal,
  calcSectionSubtotal,
  formatDate,
  formatINR, formatNumber,
  questionnaireToSpecs,
} from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PreviewStep() {
  const { quotation } = useBuilder();
  const { company } = useCompany();
  if (!quotation) return null;
  const q = quotation;
  const settings = company?.settings;
  const commercial = calcCommercial(q);

  if (!settings) return null;
  const warnings: string[] = [];
  const blockers: string[] = [];
  if (!q.customer.name) blockers.push('Customer name is required');
  if (!q.project.name) blockers.push('Project name is required');
  if (!q.quotationNumber) blockers.push('Quotation number is required');
  if (q.boqSections.length === 0 || q.boqSections.every((s) => s.items.length === 0)) blockers.push('BOQ is empty');
  if (!settings.companyName) blockers.push('Company name is required in Settings');
  if (!q.customer.mobile) warnings.push('Customer mobile is missing');
  if (q.paymentSchedule.length > 0) {
    const total = calcPaymentPercentTotal(q.paymentSchedule);
    if (Math.abs(total - 100) > 0.01) warnings.push(`Payment schedule totals ${formatNumber(total)}% (should be 100%)`);
  }
  if (q.terms.length === 0) warnings.push('No terms and conditions added');

  return (
    <div className="space-y-6">
      {(blockers.length > 0 || warnings.length > 0) && (
        <div className="space-y-3">
          {blockers.length > 0 && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1"><AlertTriangle className="w-4 h-4" /> Required to generate PDF:</div>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-1"><AlertTriangle className="w-4 h-4" /> Warnings:</div>
              <ul className="list-disc list-inside text-sm text-amber-600 space-y-0.5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {blockers.length === 0 && (
        <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 flex items-center gap-2 text-emerald-700 text-sm"><CheckCircle2 className="w-4 h-4" /> All required fields are present. You can generate the PDF.</div>
      )}

      {/* A4 Preview */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#071C3F] px-8 py-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <h1 className="text-white font-bold text-xl">{settings.companyName || 'CONSTRUCTION DOCUMENTS'}</h1>
                {settings.tagline && <p className="text-[#F4B72B] text-xs tracking-widest uppercase">{settings.tagline}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">QUOTATION</div>
              <div className="text-slate-300 text-sm">{q.quotationNumber}</div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F4B72B]" />
        </div>

        <div className="p-4 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase border-b-2 border-[#F4B72B] inline-block pr-8 mb-3">Quotation Details</h3>
              <dl className="text-sm space-y-1">
                <div className="flex gap-2"><dt className="text-slate-500 w-28">Quotation No:</dt><dd className="font-medium text-slate-800">{q.quotationNumber}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-500 w-28">Date:</dt><dd className="font-medium text-slate-800">{formatDate(q.quotationDate)}</dd></div>
                <div className="flex gap-2"><dt className="text-slate-500 w-28">Valid Until:</dt><dd className="font-medium text-slate-800">{formatDate(q.validUntil)}</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase border-b-2 border-[#F4B72B] inline-block pr-8 mb-3">Prepared For</h3>
              <div className="text-sm">
                <p className="font-semibold text-slate-800">{q.customer.name || '-'}</p>
                {q.customer.mobile && <p className="text-slate-600">Mobile: {q.customer.mobile}</p>}
                {q.customer.email && <p className="text-slate-600">{q.customer.email}</p>}
                {(q.customer.address || q.customer.city) && <p className="text-slate-600">{[q.customer.address, q.customer.city, [q.customer.state, q.customer.pincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ')}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase border-b-2 border-[#F4B72B] inline-block pr-8 mb-3">Project Details</h3>
            <dl className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <div className="flex gap-2"><dt className="text-slate-500 w-32">Project:</dt><dd className="font-medium text-slate-800">{q.project.name || '-'}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-32">Project Type:</dt><dd className="text-slate-700">{q.project.projectType}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-32">Built-up Area:</dt><dd className="text-slate-700">{q.project.builtupArea ? `${formatNumber(Number(q.project.builtupArea))} ${q.project.builtupAreaUnit}` : '-'}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-32">Floors:</dt><dd className="text-slate-700">{q.project.floors}</dd></div>
            </dl>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md ml-auto w-full">
            <div className="space-y-1.5 text-sm">
              <Row label="BOQ / Base Cost" value={formatINR(commercial.boqSubtotal)} />
              {commercial.additionalCharges > 0 && <Row label="Additional Charges" value={formatINR(commercial.additionalCharges)} />}
              {commercial.discountAmount > 0 && <Row label="Discount" value={`- ${formatINR(commercial.discountAmount)}`} />}
              <Row label="Taxable Amount" value={formatINR(commercial.taxableAmount)} />
              {commercial.taxAmount > 0 && <Row label={q.tax.name || 'Tax'} value={formatINR(commercial.taxAmount)} />}
            </div>
            <div className="mt-2 bg-[#0B2857] text-white px-4 py-2.5 rounded flex justify-between items-center">
              <span className="text-sm font-semibold">GRAND TOTAL</span>
              <span className="text-lg font-bold text-[#F4B72B]">{formatINR(commercial.grandTotal)}</span>
            </div>
            <p className="text-xs italic text-slate-500 mt-2">Amount in Words: {amountToWords(commercial.grandTotal)}</p>
          </div>

          {q.boqSections.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-[#0B2857] border-b-2 border-[#F4B72B] pb-1 mb-4">BILL OF QUANTITIES</h2>
              <div className="space-y-4">
                {q.boqSections.map((section, sIdx) => (
                  <div key={section.id}>
                    <h3 className="text-sm font-bold text-[#0B2857] mb-1">{String.fromCharCode(65 + sIdx)}. {section.title.toUpperCase()}</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className="bg-[#0B2857] text-white">
                        <th className="px-2 py-1.5 text-left border border-slate-300 w-8">S.No</th>
                        <th className="px-2 py-1.5 text-left border border-slate-300">Description</th>
                        <th className="px-2 py-1.5 text-right border border-slate-300 w-16">Qty</th>
                        <th className="px-2 py-1.5 text-center border border-slate-300 w-16">Unit</th>
                        <th className="px-2 py-1.5 text-right border border-slate-300 w-24">Rate</th>
                        <th className="px-2 py-1.5 text-right border border-slate-300 w-28">Amount</th>
                      </tr></thead>
                      <tbody>
                        {section.items.map((item, iIdx) => (
                          <tr key={item.id}>
                            <td className="px-2 py-1.5 border border-slate-200 text-slate-500">{iIdx + 1}</td>
                            <td className="px-2 py-1.5 border border-slate-200">{item.description}</td>
                            <td className="px-2 py-1.5 border border-slate-200 text-right">{formatNumber(item.quantity)}</td>
                            <td className="px-2 py-1.5 border border-slate-200 text-center">{item.unit}</td>
                            <td className="px-2 py-1.5 border border-slate-200 text-right">{formatINR(item.rate)}</td>
                            <td className="px-2 py-1.5 border border-slate-200 text-right font-medium">{formatINR(calcItemAmount(item))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr className="bg-slate-50">
                        <td colSpan={5} className="px-2 py-1.5 text-right text-xs font-semibold border border-slate-200">Section Total:</td>
                        <td className="px-2 py-1.5 text-right text-sm font-bold text-[#0B2857] border border-slate-200">{formatINR(calcSectionSubtotal(section))}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                ))}
                <div className="bg-[#0B2857] text-white px-4 py-2 rounded flex justify-between items-center">
                  <span className="text-sm font-semibold">BOQ GRAND TOTAL</span>
                  <span className="text-base font-bold text-[#F4B72B]">{formatINR(calcBOQSubtotal(q.boqSections))}</span>
                </div>
              </div>
            </div>
          )}

          {(() => {
            const qSpecs = questionnaireToSpecs(q.questionnaire);
            const allSpecs = [...qSpecs, ...q.specifications];
            return allSpecs.length > 0 ? (
              <div>
                <h2 className="text-base font-bold text-[#0B2857] border-b-2 border-[#F4B72B] pb-1 mb-3">MATERIAL & WORK SPECIFICATIONS</h2>
                <div className="space-y-2">
                  {allSpecs.map((s, i) => (
                    <div key={s.id || i} className="text-sm text-slate-700">{s.title && <span className="font-semibold">{s.title}: </span>}{s.description}</div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {(() => {
            const extraInc = q.questionnaire.extraInclusions.split('\n').map((s) => s.trim()).filter(Boolean);
            const extraExc = q.questionnaire.extraExclusions.split('\n').map((s) => s.trim()).filter(Boolean);
            const allInc = [...q.inclusions, ...extraInc];
            const allExc = [...q.exclusions, ...extraExc];
            return (
              <>
                {allInc.length > 0 && (
                  <div><h2 className="text-base font-bold text-[#0B2857] border-b-2 border-[#F4B72B] pb-1 mb-3">SCOPE OF WORK / INCLUSIONS</h2>
                    <ol className="list-decimal list-inside text-sm text-slate-700 space-y-0.5">{allInc.map((inc, i) => <li key={i}>{inc}</li>)}</ol>
                  </div>
                )}
                {allExc.length > 0 && (
                  <div><h2 className="text-base font-bold text-[#0B2857] border-b-2 border-[#F4B72B] pb-1 mb-3">EXCLUSIONS / CLIENT SCOPE</h2>
                    <ol className="list-decimal list-inside text-sm text-slate-700 space-y-0.5">{allExc.map((exc, i) => <li key={i}>{exc}</li>)}</ol>
                  </div>
                )}
              </>
            );
          })()}

          {q.paymentSchedule.length > 0 && (
            <div><h2 className="text-base font-bold text-[#0B2857] border-b-2 border-[#F4B72B] pb-1 mb-3">PAYMENT SCHEDULE</h2>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-[#0B2857] text-white">
                  <th className="px-2 py-1.5 text-left border border-slate-300 w-8">#</th>
                  <th className="px-2 py-1.5 text-left border border-slate-300">Stage</th>
                  <th className="px-2 py-1.5 text-right border border-slate-300 w-28">Percentage</th>
                  <th className="px-2 py-1.5 text-right border border-slate-300 w-32">Payable Amount</th>
                  <th className="px-2 py-1.5 text-left border border-slate-300">Notes</th>
                </tr></thead>
                <tbody>
                  {q.paymentSchedule.map((stage, idx) => (
                    <tr key={stage.id}>
                      <td className="px-2 py-1.5 border border-slate-200 text-slate-500">{idx + 1}</td>
                      <td className="px-2 py-1.5 border border-slate-200">{stage.name}</td>
                      <td className="px-2 py-1.5 border border-slate-200 text-right">{formatNumber(stage.percentage)}%</td>
                      <td className="px-2 py-1.5 border border-slate-200 text-right font-medium">{formatINR(calcPaymentAmount(stage, commercial.grandTotal))}</td>
                      <td className="px-2 py-1.5 border border-slate-200 text-slate-500">{stage.notes}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-slate-50 font-bold">
                  <td colSpan={2} className="px-2 py-1.5 text-right border border-slate-200">Total:</td>
                  <td className="px-2 py-1.5 text-right border border-slate-200">{formatNumber(calcPaymentPercentTotal(q.paymentSchedule))}%</td>
                  <td className="px-2 py-1.5 text-right border border-slate-200">{formatINR(commercial.grandTotal)}</td>
                  <td className="border border-slate-200"></td>
                </tr></tfoot>
              </table>
            </div>
          )}

          {q.terms.length > 0 && (
            <div><h2 className="text-base font-bold text-[#0B2857] border-b-2 border-[#F4B72B] pb-1 mb-3">TERMS & CONDITIONS</h2>
              <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">{q.terms.map((t) => <li key={t.id}>{t.text}</li>)}</ol>
            </div>
          )}

          {q.customerNotes.trim() && (
            <div><h2 className="text-base font-bold text-[#0B2857] border-b-2 border-[#F4B72B] pb-1 mb-3">NOTES</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{q.customerNotes}</p>
            </div>
          )}

          <div className="pt-8">
            <p className="text-sm font-bold text-[#0B2857] mb-8">For {settings.companyName || 'Construction Documents'}</p>
            <div className="border-t border-slate-300 pt-1 mt-2 w-48">
              <p className="text-sm font-semibold text-slate-800">{settings.authorizedPersonName || 'Authorized Person'}</p>
              <p className="text-xs text-slate-500">{settings.designation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-slate-600">{label}</span><span className="font-semibold text-[#0B2857]">{value}</span></div>;
}

function LogoMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#F4B72B" />
      <path d="M14 34V20L24 12L34 20V34" stroke="#071C3F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M19 34V24H29V34" stroke="#071C3F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="22" y="27" width="4" height="4" fill="#071C3F" />
      <path d="M12 34H36" stroke="#071C3F" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
