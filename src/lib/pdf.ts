// Professional PDF generation — generic construction quotation template.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CompanySettings, Quotation } from './models';
import {
  amountToWords,
  calcBOQSubtotal,
  calcCommercial,
  calcItemAmount,
  calcPaymentAmount,
  calcPaymentPercentTotal,
  calcSectionSubtotal,
  formatDate,
  formatINR,
  formatNumber,
  questionnaireToSpecs,
  sanitizeFilename,
} from './utils';

// jsPDF Helvetica does not support the ₹ Unicode glyph — use Rs. in PDFs.
function pdfINR(amount: number): string {
  return formatINR(amount).replace('₹', 'Rs.');
}

const NAVY: [number, number, number] = [11, 40, 87];
const DARK_NAVY: [number, number, number] = [7, 28, 63];
const GOLD: [number, number, number] = [244, 183, 43];
const TEXT: [number, number, number] = [11, 35, 74];
const MUTED: [number, number, number] = [100, 116, 139];
const LIGHT_BG: [number, number, number] = [247, 249, 252];
const BORDER: [number, number, number] = [226, 232, 240];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 18;
const MAX_Y = FOOTER_Y - 4;   // last usable y before footer
const CONT_START = 15;             // y to start content after continuation header
const AUTO_BOTTOM = PAGE_H - FOOTER_Y + 4; // autoTable bottom margin

// ── Image loader ──────────────────────────────────────────────────────────────
// Fetches a remote image URL and converts it to a base64 data URL for jsPDF.
// Returns null on any failure so callers fall back gracefully.
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url; // already base64
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadQuotationPDF(q: Quotation, settings: CompanySettings) {
  const resolved = await resolveSettingsImages(settings);
  const doc = generateQuotationPDF(q, resolved);
  const name = q.customer.name || 'Customer';
  const num = q.quotationNumber.replace(/[/\\]/g, '-');
  doc.save(`${num}-${sanitizeFilename(name)}.pdf`);
}

// Suggested filename for a quotation PDF (used by download/share flows).
export function quotationPdfFilename(q: Quotation): string {
  const name = q.customer.name || 'Customer';
  const num = q.quotationNumber.replace(/[/\\]/g, '-');
  return `${num}-${sanitizeFilename(name)}.pdf`;
}

// Pre-load logo and signature images so jsPDF can embed them synchronously.
async function resolveSettingsImages(settings: CompanySettings): Promise<CompanySettings> {
  const [logoData, signatureData] = await Promise.all([
    settings.logoUrl ? loadImageAsDataUrl(settings.logoUrl) : Promise.resolve(null),
    settings.signatureImage ? loadImageAsDataUrl(settings.signatureImage) : Promise.resolve(null),
  ]);
  return {
    ...settings,
    logoUrl: logoData ?? undefined,
    signatureImage: signatureData ?? undefined,
  };
}

// Builds the PDF without saving it — used for the in-app preview modal.
export async function buildQuotationPDFBlob(q: Quotation, settings: CompanySettings): Promise<Blob> {
  const resolved = await resolveSettingsImages(settings);
  const doc = generateQuotationPDF(q, resolved);
  return doc.output('blob');
}

// Merge manually-added specifications with those generated from the questionnaire.
function mergedSpecs(q: Quotation): Quotation['specifications'] {
  const qSpecs = questionnaireToSpecs(q.questionnaire);
  return [...qSpecs, ...q.specifications];
}

function generateQuotationPDF(q: Quotation, settings: CompanySettings): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const commercial = calcCommercial(q);

  drawCoverPage(doc, q, settings, commercial);

  let y = CONT_START;

  // BOQ always gets a fresh page
  if (q.boqSections.length > 0) {
    doc.addPage();
    drawContHeader(doc, q, settings);
    y = drawBOQ(doc, q, settings, y);
  }

  // Specifications (manual + questionnaire-generated)
  const specs = mergedSpecs(q);
  if (specs.length > 0) {
    y = gapOrPage(doc, q, settings, y, 30);
    y = drawSpecs(doc, q, settings, y, specs);
  }

  // Scope & exclusions (checkbox lists + questionnaire extras)
  const extraInc = q.questionnaire.extraInclusions.split('\n').map((s) => s.trim()).filter(Boolean);
  const extraExc = q.questionnaire.extraExclusions.split('\n').map((s) => s.trim()).filter(Boolean);
  const allInc = [...q.inclusions, ...extraInc];
  const allExc = [...q.exclusions, ...extraExc];
  if (allInc.length > 0 || allExc.length > 0) {
    y = gapOrPage(doc, q, settings, y, 30);
    y = drawScope(doc, q, settings, y, allInc, allExc);
  }

  // Payment schedule
  if (q.paymentSchedule.length > 0) {
    y = gapOrPage(doc, q, settings, y, 35);
    y = drawPayment(doc, q, settings, commercial, y);
  }

  // Commercial summary
  y = gapOrPage(doc, q, settings, y, 55);
  y = drawCommercial(doc, q, settings, commercial, y);

  // Terms & conditions
  if (q.terms.length > 0) {
    y = gapOrPage(doc, q, settings, y, 25);
    y = drawTerms(doc, q, settings, y);
  }

  // Customer notes
  if (q.customerNotes.trim()) {
    y = gapOrPage(doc, q, settings, y, 25);
    y = drawNotes(doc, q, settings, y);
  }

  // Signature / acceptance
  y = gapOrPage(doc, q, settings, y, 55);
  drawAcceptance(doc, q, settings, y);

  addFooters(doc, q, settings);
  return doc;
}

// If `needed` mm doesn't fit on current page, add a new page and return CONT_START.
// Otherwise return y + a visual gap between sections on the same page.
function gapOrPage(
  doc: jsPDF,
  q: Quotation,
  settings: CompanySettings,
  y: number,
  needed: number,
): number {
  if (y + needed > MAX_Y) {
    doc.addPage();
    drawContHeader(doc, q, settings);
    return CONT_START;
  }
  return y + 9;
}

// ─── Cover page ────────────────────────────────────────────────────────────────

function drawCoverPage(
  doc: jsPDF,
  q: Quotation,
  settings: CompanySettings,
  commercial: ReturnType<typeof calcCommercial>,
) {
  // Header band
  doc.setFillColor(...DARK_NAVY);
  doc.rect(0, 0, PAGE_W, 40, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 40, PAGE_W, 1.5, 'F');

  // Logo — prefer configured logo image; fall back to mark
  if (settings.logoUrl) {
    try {
      const fmt = settings.logoUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(settings.logoUrl, fmt, MARGIN, 12, 14, 14);
    } catch {
      drawLogoMark(doc, MARGIN, 19);
    }
  } else {
    drawLogoMark(doc, MARGIN, 19);
  }

  // Company name + tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const companyName = (settings.companyName || 'CONSTRUCTION DOCUMENTS').toUpperCase();
  doc.text(companyName, MARGIN + 14, 24);

  if (settings.tagline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(settings.tagline.toUpperCase(), MARGIN + 14, 30);
  }

  const idLines = [
    settings.gstin ? `GSTIN: ${settings.gstin}` : null,
    settings.pan ? `PAN: ${settings.pan}` : null,
  ].filter(Boolean);
  if (idLines.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(idLines.join('  |  '), PAGE_W - MARGIN, 38, { align: 'right' });
  }

  // Right: QUOTATION label + number
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('QUOTATION', PAGE_W - MARGIN, 22, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(q.quotationNumber, PAGE_W - MARGIN, 30, { align: 'right' });

  let y = 50;

  // ── Left column: Quotation Details + Prepared For ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('QUOTATION DETAILS', MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 1.5, MARGIN + 46, y + 1.5);
  y += 6;

  const meta: [string, string][] = [
    ['Quotation No.', q.quotationNumber],
    ['Quotation Date', formatDate(q.quotationDate)],
    ['Valid Until', formatDate(q.validUntil)],
  ];
  doc.setFontSize(9);
  meta.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT);
    doc.text(val || '-', MARGIN + 32, y);
    y += 5;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('PREPARED FOR', MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.line(MARGIN, y + 1.5, MARGIN + 36, y + 1.5);
  y += 6;

  const c = q.customer;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text(c.name || '-', MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  if (c.mobile) { doc.text(`Mobile: ${c.mobile}`, MARGIN, y); y += 4.2; }
  if (c.email) { doc.text(`Email: ${c.email}`, MARGIN, y); y += 4.2; }
  const addrParts = [
    c.address,
    c.city,
    [c.state, c.pincode].filter(Boolean).join(' - '),
  ].filter(Boolean);
  addrParts.forEach((line) => { doc.text(line, MARGIN, y); y += 4.2; });

  // ── Right column: Project Details ──
  let py = 50;
  const px = PAGE_W / 2 + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('PROJECT DETAILS', px, py);
  doc.setDrawColor(...GOLD);
  doc.line(px, py + 1.5, px + 46, py + 1.5);
  py += 6;

  const p = q.project;
  const pmeta: [string, string][] = [
    ['Project', p.name || '-'],
    ['Project Type', p.projectType],
    ['Built-up Area', p.builtupArea ? `${formatNumber(Number(p.builtupArea))} ${p.builtupAreaUnit}` : '-'],
    ['Floors', p.floors],
    ['Location', [p.city, p.state].filter(Boolean).join(', ') || '-'],
  ];
  const valW = PAGE_W - MARGIN - px - 33;
  pmeta.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(label, px, py);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT);
    const valLines = doc.splitTextToSize(String(val || '-'), valW);
    doc.text(valLines[0] || '-', px + 33, py);
    py += 5;
  });

  // ── Summary box ──
  const boxTop = Math.max(y, py) + 7;
  drawSummaryBox(doc, MARGIN, boxTop, commercial, q);

  const boxBottom = boxTop + getSummaryBoxH(commercial, q);

  // Amount in words
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const wordsLines = doc.splitTextToSize(
    `Amount in Words: ${amountToWords(commercial.grandTotal)}`,
    CONTENT_W,
  );
  doc.text(wordsLines, MARGIN, boxBottom + 5);

  // Compact company contact strip — right below amount-in-words
  const hasContact = settings.address || settings.mobile || settings.email;
  if (hasContact) {
    const stripY = boxBottom + 5 + wordsLines.length * 4.5 + 5;
    doc.setFillColor(...LIGHT_BG);
    doc.rect(MARGIN, stripY, CONTENT_W, 14, 'F');
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, stripY, CONTENT_W, 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(settings.companyName || '', MARGIN + 3, stripY + 4.5);

    const contactParts: string[] = [];
    if (settings.mobile) contactParts.push(`Ph: ${settings.mobile}`);
    if (settings.email) contactParts.push(settings.email);
    if (settings.website) contactParts.push(settings.website);

    const addrLine = [
      settings.address,
      settings.city,
      [settings.state, settings.pincode].filter(Boolean).join(' - '),
    ].filter(Boolean).join(', ');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    if (addrLine) doc.text(addrLine, MARGIN + 3, stripY + 8.5);
    if (contactParts.length) doc.text(contactParts.join('  |  '), MARGIN + 3, stripY + 12.5);
  }
}

function getSummaryBoxH(commercial: ReturnType<typeof calcCommercial>, q: Quotation): number {
  const rowH = 6;
  let rows = 2; // BOQ base + taxable
  if (commercial.additionalCharges > 0) rows++;
  if (commercial.discountAmount > 0) rows++;
  if (commercial.taxAmount > 0) rows++;
  return rows * rowH + 10 + 11; // content + padding + grand total bar
}

function drawSummaryBox(
  doc: jsPDF,
  x: number,
  y: number,
  commercial: ReturnType<typeof calcCommercial>,
  q: Quotation,
) {
  const w = CONTENT_W;
  const rowH = 6;
  const rows: [string, string][] = [['BOQ / Base Cost', pdfINR(commercial.boqSubtotal)]];
  if (commercial.additionalCharges > 0) rows.push(['Additional Charges', pdfINR(commercial.additionalCharges)]);
  if (commercial.discountAmount > 0) rows.push(['Discount', `- ${pdfINR(commercial.discountAmount)}`]);
  rows.push(['Taxable Amount', pdfINR(commercial.taxableAmount)]);
  if (commercial.taxAmount > 0) rows.push([q.tax.name || 'Tax', pdfINR(commercial.taxAmount)]);

  const boxH = rows.length * rowH + 10;
  doc.setFillColor(...LIGHT_BG);
  doc.rect(x, y, w, boxH, 'F');
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, boxH);

  let cy = y + 7;
  doc.setFontSize(9.5);
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, x + 4, cy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT);
    doc.text(val, x + w - 4, cy, { align: 'right' });
    cy += rowH;
  });

  // Grand total bar
  doc.setFillColor(...NAVY);
  doc.rect(x, cy, w, 11, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL', x + 4, cy + 7);
  doc.setTextColor(...GOLD);
  doc.text(pdfINR(commercial.grandTotal), x + w - 4, cy + 7, { align: 'right' });
}

// ─── Logo mark ─────────────────────────────────────────────────────────────────

function drawLogoMark(doc: jsPDF, x: number, y: number) {
  const s = 10;
  doc.setFillColor(...GOLD);
  doc.roundedRect(x, y, s, s, 1.5, 1.5, 'F');
  doc.setDrawColor(...DARK_NAVY);
  doc.setLineWidth(0.8);
  // House / building outline
  doc.line(x + 2, y + s - 2, x + 2, y + 3.5);
  doc.line(x + 2, y + 3.5, x + s / 2, y + 1.5);
  doc.line(x + s / 2, y + 1.5, x + s - 2, y + 3.5);
  doc.line(x + s - 2, y + 3.5, x + s - 2, y + s - 2);
  // Door
  doc.line(x + 3.5, y + s - 2, x + 3.5, y + 5.5);
  doc.line(x + 3.5, y + 5.5, x + s - 3.5, y + 5.5);
  doc.line(x + s - 3.5, y + 5.5, x + s - 3.5, y + s - 2);
  // Base line
  doc.line(x + 1.5, y + s - 2, x + s - 1.5, y + s - 2);
}

// ─── BOQ ───────────────────────────────────────────────────────────────────────

function drawBOQ(doc: jsPDF, q: Quotation, settings: CompanySettings, startY: number): number {
  let y = startY;

  q.boqSections.forEach((section, sIdx) => {
    if (y > MAX_Y - 40) {
      doc.addPage();
      drawContHeader(doc, q, settings);
      y = CONT_START;
    }

    const letter = String.fromCharCode(65 + sIdx);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    doc.text(`${letter}. ${section.title.toUpperCase()}`, MARGIN, y);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 1.5, PAGE_W - MARGIN, y + 1.5);
    y += 5;

    const rows = section.items.map((item, idx) => [
      String(idx + 1),
      item.description,
      formatNumber(item.quantity),
      item.unit,
      pdfINR(item.rate),
      pdfINR(calcItemAmount(item)),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['S.No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8.5, fontStyle: 'bold', cellPadding: 2 },
      bodyStyles: { fontSize: 8.5, textColor: TEXT, lineColor: BORDER, lineWidth: 0.1, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 13, halign: 'right' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: MARGIN, right: MARGIN, top: CONT_START + 4, bottom: AUTO_BOTTOM },
      willDrawPage: () => { drawContHeader(doc, q, settings); },
    });

    y = (doc as any).lastAutoTable.finalY + 3;

    // Section total — right-aligned below the table
    if (y > MAX_Y - 8) {
      doc.addPage();
      drawContHeader(doc, q, settings);
      y = CONT_START;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(`Section Total: ${pdfINR(calcSectionSubtotal(section))}`, PAGE_W - MARGIN, y, { align: 'right' });
    y += 7;
  });

  // BOQ Grand Total bar
  if (y > MAX_Y - 12) {
    doc.addPage();
    drawContHeader(doc, q, settings);
    y = CONT_START;
  }
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y, CONTENT_W, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('BOQ GRAND TOTAL', MARGIN + 3, y + 7);
  doc.setTextColor(...GOLD);
  doc.text(pdfINR(calcBOQSubtotal(q.boqSections)), PAGE_W - MARGIN - 3, y + 7, { align: 'right' });

  return y + 10;
}

// ─── Specifications ────────────────────────────────────────────────────────────

// Not exported — only drawSpecs
function drawSpecs(doc: jsPDF, q: Quotation, settings: CompanySettings, y: number, specs: Quotation['specifications']): number {
  y = sectionHeading(doc, 'MATERIAL & WORK SPECIFICATIONS', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  specs.forEach((s) => {
    if (s.title) {
      if (y > MAX_Y - 12) { y = pageBreak(doc, q, settings); }
      doc.setFont('helvetica', 'bold');
      doc.text(s.title, MARGIN, y);
      y += 4.5;
    }
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(s.description, CONTENT_W);
    lines.forEach((line: string) => {
      if (y > MAX_Y - 8) { y = pageBreak(doc, q, settings); }
      doc.text(line, MARGIN, y);
      y += 4.5;
    });
    y += 2;
  });
  return y;
}

// ─── Scope & Exclusions ────────────────────────────────────────────────────────

function drawScope(doc: jsPDF, q: Quotation, settings: CompanySettings, y: number, inclusions: string[], exclusions: string[]): number {
  if (inclusions.length > 0) {
    y = sectionHeading(doc, 'SCOPE OF WORK / INCLUSIONS', y);
    y = drawListItems(doc, q, settings, inclusions, y);
    if (exclusions.length > 0) y += 6;
  }

  if (exclusions.length > 0) {
    if (y > MAX_Y - 20) { y = pageBreak(doc, q, settings); }
    y = sectionHeading(doc, 'EXCLUSIONS / CLIENT SCOPE', y);
    y = drawListItems(doc, q, settings, exclusions, y);
  }

  return y;
}

function drawListItems(
  doc: jsPDF,
  q: Quotation,
  settings: CompanySettings,
  items: string[],
  y: number,
): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  items.forEach((item, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${item}`, CONTENT_W - 4);
    lines.forEach((line: string) => {
      if (y > MAX_Y - 8) { y = pageBreak(doc, q, settings); }
      doc.text(line, MARGIN, y);
      y += 4.5;
    });
    y += 1;
  });
  return y;
}

// ─── Payment Schedule ──────────────────────────────────────────────────────────

function drawPayment(
  doc: jsPDF,
  q: Quotation,
  settings: CompanySettings,
  commercial: ReturnType<typeof calcCommercial>,
  y: number,
): number {
  y = sectionHeading(doc, 'PAYMENT SCHEDULE', y);

  const rows = q.paymentSchedule.map((stage, i) => [
    String(i + 1),
    stage.name,
    `${formatNumber(stage.percentage)}%`,
    pdfINR(calcPaymentAmount(stage, commercial.grandTotal)),
    stage.notes || '',
  ]);
  const totalAmt = q.paymentSchedule.reduce(
    (s, st) => s + calcPaymentAmount(st, commercial.grandTotal),
    0,
  );

  autoTable(doc, {
    startY: y,
    head: [['#', 'Stage', 'Percentage', 'Payable Amount', 'Notes']],
    body: rows,
    foot: [['', 'Total', `${formatNumber(calcPaymentPercentTotal(q.paymentSchedule))}%`, pdfINR(totalAmt), '']],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8.5, fontStyle: 'bold', cellPadding: 2 },
    footStyles: { fillColor: LIGHT_BG, textColor: NAVY, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: TEXT, lineColor: BORDER, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 32, halign: 'right' },
    },
    margin: { left: MARGIN, right: MARGIN, top: CONT_START + 4, bottom: AUTO_BOTTOM },
    willDrawPage: () => { drawContHeader(doc, q, settings); },
  });

  return (doc as any).lastAutoTable.finalY + 3;
}

// ─── Commercial Summary ────────────────────────────────────────────────────────

function drawCommercial(
  doc: jsPDF,
  q: Quotation,
  settings: CompanySettings,
  commercial: ReturnType<typeof calcCommercial>,
  y: number,
): number {
  y = sectionHeading(doc, 'COMMERCIAL SUMMARY', y);

  const rows: [string, string][] = [['BOQ / Base Cost', pdfINR(commercial.boqSubtotal)]];
  if (commercial.additionalCharges > 0) rows.push(['Additional Charges', pdfINR(commercial.additionalCharges)]);
  if (commercial.discountAmount > 0) rows.push(['Discount', `- ${pdfINR(commercial.discountAmount)}`]);
  rows.push(['Taxable Amount', pdfINR(commercial.taxableAmount)]);
  if (commercial.taxAmount > 0) rows.push([q.tax.name || 'Tax', pdfINR(commercial.taxAmount)]);

  autoTable(doc, {
    startY: y,
    body: rows,
    theme: 'plain',
    bodyStyles: { fontSize: 10, textColor: TEXT, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } },
    columnStyles: {
      0: { cellWidth: CONTENT_W - 50 },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: MARGIN, right: MARGIN, bottom: AUTO_BOTTOM },
    willDrawPage: () => { drawContHeader(doc, q, settings); },
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // Grand total bar
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y, CONTENT_W, 11, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL', MARGIN + 4, y + 7.5);
  doc.setTextColor(...GOLD);
  doc.text(pdfINR(commercial.grandTotal), PAGE_W - MARGIN - 4, y + 7.5, { align: 'right' });
  y += 14;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const wordsLines = doc.splitTextToSize(
    `Amount in Words: ${amountToWords(commercial.grandTotal)}`,
    CONTENT_W,
  );
  wordsLines.forEach((line: string) => { doc.text(line, MARGIN, y); y += 4.5; });

  return y;
}

// ─── Terms & Conditions ────────────────────────────────────────────────────────

function drawTerms(doc: jsPDF, q: Quotation, settings: CompanySettings, y: number): number {
  y = sectionHeading(doc, 'TERMS & CONDITIONS', y);
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);

  q.terms.forEach((term, i) => {
    if (y > MAX_Y - 14) { y = pageBreak(doc, q, settings); }
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}.`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(term.text, CONTENT_W - 8);
    lines.forEach((line: string) => {
      if (y > MAX_Y - 8) { y = pageBreak(doc, q, settings); }
      doc.text(line, MARGIN + 6, y);
      y += 4.5;
    });
    y += 2;
  });

  return y;
}

// ─── Customer Notes ────────────────────────────────────────────────────────────

function drawNotes(doc: jsPDF, q: Quotation, settings: CompanySettings, y: number): number {
  y = sectionHeading(doc, 'NOTES', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  const lines = doc.splitTextToSize(q.customerNotes, CONTENT_W);
  lines.forEach((line: string) => {
    if (y > MAX_Y - 8) { y = pageBreak(doc, q, settings); }
    doc.text(line, MARGIN, y);
    y += 4.5;
  });
  return y;
}

// ─── Acceptance / Signature ────────────────────────────────────────────────────

function drawAcceptance(doc: jsPDF, q: Quotation, settings: CompanySettings, y: number) {
  // Terms preamble
  if (y > MAX_Y - 45) { y = pageBreak(doc, q, settings); }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Acceptance & Signature', MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 1.5, PAGE_W - MARGIN, y + 1.5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const acceptLines = doc.splitTextToSize(
    'I/We hereby accept the above quotation and agree to the terms and conditions. The work shall commence upon receipt of the first payment.',
    CONTENT_W,
  );
  doc.text(acceptLines, MARGIN, y);
  y += acceptLines.length * 4.5 + 18;

  // Signature block — right-aligned
  if (y > MAX_Y - 35) { y = pageBreak(doc, q, settings); }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  const sigRight = PAGE_W - MARGIN;
  const sigLeft = sigRight - 60;
  doc.text(`For ${settings.companyName || 'Construction Documents'}`, sigLeft, y);
  y += 18;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(sigLeft, y, sigRight, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  doc.text(settings.authorizedPersonName || 'Authorized Person', sigLeft, y);
  y += 4.5;

  if (settings.designation) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(settings.designation, sigLeft, y);
  }

  // Signature image (if provided)
  if (settings.signatureImage) {
    try {
      const fmt = settings.signatureImage.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(settings.signatureImage, fmt, sigLeft, y - 28, 40, 20);
    } catch {
      // ignore image errors
    }
  }

  // Bank details (if configured)
  if (settings.showBankOnPdf && (settings.bankName || settings.accountName || settings.accountNumber)) {
    y += 10;
    y = sectionHeading(doc, 'PAYMENT DETAILS', y);
    const bankRows: [string, string][] = ([
      ['Account Name', settings.accountName],
      ['Bank', settings.bankName],
      ['Account Number', settings.accountNumber],
      ['IFSC', settings.ifsc],
      ['Branch', settings.branch],
      ['UPI ID', settings.upiId],
    ] as [string, string][]).filter(([, v]) => v);

    doc.setFontSize(9);
    bankRows.forEach(([label, val]) => {
      if (y > MAX_Y - 8) { y = pageBreak(doc, q, settings); }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...MUTED);
      doc.text(`${label}:`, MARGIN, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT);
      doc.text(val, MARGIN + 34, y);
      y += 5;
    });
    y += 6;
  }
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function sectionHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...NAVY);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4);
  return y + 12;
}

// Add a new page, draw the continuation header, and return the content start y.
function pageBreak(doc: jsPDF, q: Quotation, settings: CompanySettings): number {
  doc.addPage();
  drawContHeader(doc, q, settings);
  return CONT_START;
}

function drawContHeader(doc: jsPDF, q: Quotation, settings: CompanySettings) {
  if (doc.getNumberOfPages() <= 1) return;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text((settings.companyName || 'CONSTRUCTION DOCUMENTS').toUpperCase(), MARGIN, 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(q.quotationNumber, PAGE_W - MARGIN, 8, { align: 'right' });
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 10.5, PAGE_W - MARGIN, 10.5);
}

// ─── Footer on every page ──────────────────────────────────────────────────────

function addFooters(doc: jsPDF, q: Quotation, settings: CompanySettings) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const y = FOOTER_Y;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const left = settings.mobile
      ? `${settings.companyName}  |  ${settings.mobile}`
      : (settings.companyName || 'Construction Documents');
    doc.text(left, MARGIN, y);
    doc.text(`Quotation: ${q.quotationNumber}`, PAGE_W / 2, y, { align: 'center' });
    doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, y, { align: 'right' });
    if (settings.footerText && i === total) {
      doc.setFont('helvetica', 'italic');
      const fLines = doc.splitTextToSize(settings.footerText, CONTENT_W);
      doc.text(fLines[0] || '', PAGE_W / 2, y + 4, { align: 'center' });
    }
  }
}
