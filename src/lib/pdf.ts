// Quotation PDF — brand-themed (per-company logo & colors), width-safe layout.
// Building blocks live in pdfTheme.ts / pdfKit.ts / pdfFonts.ts and are shared by
// every PDF type; this file only decides what goes where on a quotation.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BOQSection, CompanySettings, Quotation } from './models';
import {
  amountToWords,
  calcBOQSubtotal,
  calcCommercial,
  calcItemAmount,
  calcPaymentAmount,
  calcPaymentPercentTotal,
  calcSectionSubtotal,
  formatDate,
  questionnaireToSpecs,
  sanitizeFilename,
} from './utils';
import { createPdfTheme } from './pdfTheme';
import { loadPdfFonts, registerPdfFonts, type PdfFontData } from './pdfFonts';
import {
  CONTENT_W, MARGIN, MAX_Y, PAGE_W, TABLE_MARGIN,
  addFooters, cardLayout, drawDefaultLogo, drawImageFit, ensureContHeader, ensureSpace, fitText, glueFragileTokens,
  money, newPage, num2, qtyFmt, sectionHeading, sectionLetter, setFont, unitLabel, wrapShrink,
  type PdfCtx,
} from './pdfKit';

// ── Public API ──────────────────────────────────────────────────────────────────

export async function downloadQuotationPDF(q: Quotation, settings: CompanySettings) {
  const doc = await renderQuotation(q, settings);
  doc.save(quotationPdfFilename(q));
}

// Suggested filename for a quotation PDF (used by download/share flows).
export function quotationPdfFilename(q: Quotation): string {
  const name = q.customer.name || 'Customer';
  const num = q.quotationNumber.replace(/[/\\]/g, '-');
  return `${num}-${sanitizeFilename(name)}.pdf`;
}

// Builds the PDF without saving it — used for the in-app preview modal.
export async function buildQuotationPDFBlob(q: Quotation, settings: CompanySettings): Promise<Blob> {
  const doc = await renderQuotation(q, settings);
  return doc.output('blob');
}

async function renderQuotation(q: Quotation, settings: CompanySettings): Promise<jsPDF> {
  const [fonts, resolved] = await Promise.all([loadPdfFonts(), resolveSettingsImages(settings)]);
  return generateQuotationPDF(q, resolved, fonts);
}

// ── Image loading ───────────────────────────────────────────────────────────────

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Pre-load logo and signature so jsPDF can embed them synchronously.
async function resolveSettingsImages(settings: CompanySettings): Promise<CompanySettings> {
  const [logo, signature] = await Promise.all([
    settings.logoUrl ? loadImageAsDataUrl(settings.logoUrl) : Promise.resolve(null),
    settings.signatureImage ? loadImageAsDataUrl(settings.signatureImage) : Promise.resolve(null),
  ]);
  return { ...settings, logoUrl: logo ?? undefined, signatureImage: signature ?? undefined };
}

// Merge manually-added specifications with those generated from the questionnaire.
function mergedSpecs(q: Quotation): Quotation['specifications'] {
  return [...questionnaireToSpecs(q.questionnaire), ...q.specifications];
}

const splitLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

// A BOQ row with no quantity and no rate carries text only (engineer's note, remark) —
// it is shown as a full-width note instead of a "Qty 0 / Rs.0" line item.
const isNoteItem = (item: BOQSection['items'][number]) =>
  !(Number(item.quantity) || 0) && !(Number(item.rate) || 0);

// ── Generator ───────────────────────────────────────────────────────────────────

function generateQuotationPDF(q: Quotation, settings: CompanySettings, fonts: PdfFontData | null): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  if (fonts) registerPdfFonts(doc, fonts);
  const theme = createPdfTheme(
    { primaryColor: settings.primaryColor, secondaryColor: settings.secondaryColor },
    !!fonts,
  );
  const ctx: PdfCtx = {
    doc, theme, headed: new Set(),
    docRef: q.quotationNumber,
    companyName: settings.companyName || 'Construction Documents',
    phone: settings.mobile,
  };
  const commercial = calcCommercial(q);

  // Page 1 — letterhead, parties, cost summary, totals
  let y = drawLetterhead(ctx, q, settings);
  y = drawParties(ctx, q, y + 6);
  y = drawCostSummary(ctx, q, commercial, y + 7);

  // BOQ detail — starts on a fresh page
  if (q.boqSections.length > 0) {
    y = newPage(ctx);
    y = drawBOQ(ctx, q, y);
  }

  const specs = mergedSpecs(q);
  if (specs.length > 0) y = drawSpecs(ctx, ensureSpace(ctx, y + 9, 30), specs);

  const allInc = [...q.inclusions, ...splitLines(q.questionnaire.extraInclusions)];
  const allExc = [...q.exclusions, ...splitLines(q.questionnaire.extraExclusions)];
  if (allInc.length || allExc.length) y = drawScope(ctx, ensureSpace(ctx, y + 9, 40), allInc, allExc);

  if (q.paymentSchedule.length > 0) y = drawPayment(ctx, q, commercial.grandTotal, ensureSpace(ctx, y + 9, 45));

  if (settings.showBankOnPdf) y = drawBank(ctx, settings, y + 8);

  if (q.terms.length > 0) y = drawTerms(ctx, q, ensureSpace(ctx, y + 9, 30));

  if (q.customerNotes.trim()) y = drawNotes(ctx, q, ensureSpace(ctx, y + 9, 25));

  drawAcceptance(ctx, settings, ensureSpace(ctx, y + 10, 62));

  addFooters(ctx, settings.footerText);
  return doc;
}

// ── Page 1: letterhead ──────────────────────────────────────────────────────────

function drawLetterhead(ctx: PdfCtx, q: Quotation, s: CompanySettings): number {
  const { doc, theme } = ctx;
  doc.setFillColor(...theme.primary);
  doc.rect(0, 0, PAGE_W, 4, 'F');
  doc.setFillColor(...theme.rule);
  doc.rect(0, 4, PAGE_W, 1.2, 'F');

  const top = 12;
  const rightW = 58;
  const rightX = PAGE_W - MARGIN;

  // Logo (aspect-correct, never stretched — fitted inside a 32x20mm box) or, if the
  // company hasn't uploaded one, a generic brand-colored placeholder mark so the header
  // never looks empty.
  let textX = MARGIN;
  let logoBottom = top;
  const logo = s.logoUrl
    ? drawImageFit(doc, s.logoUrl, MARGIN, top, 32, 20)
    : drawDefaultLogo(doc, theme.primary, theme.rule, theme.onPrimary, MARGIN, top, 32, 20);
  if (logo) {
    textX = MARGIN + logo.w + 6;
    logoBottom = top + logo.h;
  }

  // Company block — width-limited so it can never reach the right-hand title block
  const nameW = rightX - rightW - 6 - textX;
  const name = wrapShrink(doc, theme, ctx.companyName, nameW, 2, 15, 10);
  setFont(doc, theme, 'bold', name.size, theme.heading);
  let ly = top + 5;
  const lineH = name.size * 0.42;
  name.lines.forEach((line) => { doc.text(line, textX, ly); ly += lineH; });
  ly -= lineH - 4;

  if (s.tagline) {
    setFont(doc, theme, 'italic', 8, theme.muted);
    doc.text(fitText(doc, theme, s.tagline, nameW), textX, ly);
    ly += 4;
  }
  setFont(doc, theme, 'normal', 8, theme.muted);
  const addr = [s.address, s.city, [s.state, s.pincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ');
  if (addr) {
    (doc.splitTextToSize(addr, nameW) as string[]).slice(0, 2).forEach((line) => { doc.text(line, textX, ly); ly += 3.7; });
  }
  const contact = [s.mobile && `Ph: ${s.mobile}`, s.email, s.website].filter(Boolean).join('   |   ');
  if (contact) { doc.text(fitText(doc, theme, contact, nameW), textX, ly); ly += 3.7; }
  const ids = [s.gstin && `GSTIN: ${s.gstin}`, s.pan && `PAN: ${s.pan}`].filter(Boolean).join('   |   ');
  if (ids) { doc.text(fitText(doc, theme, ids, nameW), textX, ly); ly += 3.7; }

  // Title block
  setFont(doc, theme, 'bold', 18, theme.heading);
  doc.text('QUOTATION', rightX, top + 6, { align: 'right' });
  setFont(doc, theme, 'bold', 10, theme.text);
  doc.text(fitText(doc, theme, q.quotationNumber, rightW), rightX, top + 13, { align: 'right' });
  setFont(doc, theme, 'normal', 8.5, theme.muted);
  doc.text(`Date: ${formatDate(q.quotationDate)}`, rightX, top + 19, { align: 'right' });
  doc.text(`Valid until: ${formatDate(q.validUntil)}`, rightX, top + 24, { align: 'right' });
  const rightBottom = top + 25;

  const bottom = Math.max(logoBottom, ly, rightBottom) + 3;
  doc.setDrawColor(...theme.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, bottom, PAGE_W - MARGIN, bottom);
  return bottom;
}

// ── Page 1: customer & project cards ────────────────────────────────────────────

function drawParties(ctx: PdfCtx, q: Quotation, y: number): number {
  const c = q.customer;
  const p = q.project;
  const w = (CONTENT_W - 6) / 2;

  const customerAddr = [c.address, c.city, [c.state, c.pincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ');
  const left = cardLayout(ctx, w, 'Prepared for', [
    { value: c.name || '-', strong: true },
    { label: 'Mobile', value: c.mobile },
    { label: 'Email', value: c.email },
    { label: 'Address', value: customerAddr },
  ]);

  const location = [p.address, p.city, p.state].filter(Boolean).join(', ');
  const area = p.builtupArea ? `${qtyFmt(Number(p.builtupArea))} ${p.builtupAreaUnit}`.trim() : '';
  const right = cardLayout(ctx, w, 'Project details', [
    { label: 'Project', value: p.name || '-' },
    { label: 'Project type', value: p.projectType },
    { label: 'Built-up area', value: area },
    { label: 'Floors', value: p.floors },
    { label: 'Location', value: location || '-' },
  ]);

  const h = Math.max(left.height, right.height);
  left.draw(MARGIN, y, h);
  right.draw(MARGIN + w + 6, y, h);
  return y + h;
}

// ── Page 1: section-wise cost summary + totals ──────────────────────────────────

function drawCostSummary(
  ctx: PdfCtx, q: Quotation, commercial: ReturnType<typeof calcCommercial>, y: number,
): number {
  const { doc, theme } = ctx;
  const cur = theme.rupee;

  if (q.boqSections.length > 0) {
    y = sectionHeading(ctx, 'Cost summary', y);
    const R = (content: string) => ({ content, styles: { halign: 'right' as const } });
    const boq = calcBOQSubtotal(q.boqSections);
    const compact = q.boqSections.length > 14;
    autoTable(doc, {
      startY: y,
      head: [['Ref', 'Description of work', `Amount (${cur})`, '% of BOQ']],
      body: q.boqSections.map((s, i) => {
        const total = calcSectionSubtotal(s);
        return [
          sectionLetter(i),
          s.title,
          total > 0 ? num2(total) : '—',
          total > 0 && boq > 0 ? `${((total / boq) * 100).toFixed(1)}%` : '—',
        ];
      }),
      foot: [['', 'BOQ total', R(num2(boq)), R(boq > 0 ? '100%' : '—')]],
      showFoot: 'lastPage', // the total is only correct once every section row has rendered
      rowPageBreak: 'avoid',
      theme: 'striped',
      styles: { font: theme.font, fontSize: compact ? 8 : 8.5, textColor: theme.text, cellPadding: { top: compact ? 1.3 : 1.9, bottom: compact ? 1.3 : 1.9, left: 2.5, right: 2.5 }, lineWidth: 0 },
      headStyles: { fillColor: theme.primary, textColor: theme.onPrimary, fontStyle: 'bold' },
      footStyles: { fillColor: theme.tint, textColor: theme.heading, fontStyle: 'bold', lineColor: theme.border, lineWidth: { top: 0.4, right: 0, bottom: 0, left: 0 } as any },
      alternateRowStyles: { fillColor: theme.tint },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: theme.heading },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 38, halign: 'right' },
        3: { cellWidth: 22, halign: 'right', textColor: theme.muted },
      },
      margin: TABLE_MARGIN,
      willDrawPage: () => ensureContHeader(ctx),
    });
    y = (doc as any).lastAutoTable.finalY + 7;
  }

  return drawTotals(ctx, q, commercial, y);
}

function drawTotals(
  ctx: PdfCtx, q: Quotation, commercial: ReturnType<typeof calcCommercial>, y: number,
): number {
  const { doc, theme } = ctx;
  const boxW = 92;
  const x = PAGE_W - MARGIN - boxW;

  const rows: [string, string][] = [['BOQ / base cost', money(theme, commercial.boqSubtotal)]];
  if (commercial.additionalCharges > 0) rows.push(['Additional charges', money(theme, commercial.additionalCharges)]);
  if (commercial.discountAmount > 0) rows.push(['Discount', `- ${money(theme, commercial.discountAmount)}`]);
  rows.push(['Taxable amount', money(theme, commercial.taxableAmount)]);
  if (commercial.taxAmount > 0) {
    rows.push([`${q.tax.name || 'Tax'} @ ${qtyFmt(q.tax.rate)}%`, money(theme, commercial.taxAmount)]);
  }

  const rowH = 6.4;
  const bodyH = rows.length * rowH + 4;
  const barH = 12;
  y = ensureSpace(ctx, y, bodyH + barH + 2);

  // Left: amount in words
  setFont(doc, theme, 'bold', 7.5, theme.heading);
  doc.text('AMOUNT IN WORDS', MARGIN, y + 4);
  doc.setDrawColor(...theme.rule);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y + 5.6, MARGIN + 12, y + 5.6);
  setFont(doc, theme, 'italic', 9, theme.text);
  doc.text(doc.splitTextToSize(amountToWords(commercial.grandTotal), CONTENT_W - boxW - 10), MARGIN, y + 11);

  // Right: totals
  doc.setFillColor(...theme.tint);
  doc.setDrawColor(...theme.border);
  doc.setLineWidth(0.25);
  doc.rect(x, y, boxW, bodyH, 'FD');
  let cy = y + 6;
  rows.forEach(([label, value]) => {
    setFont(doc, theme, 'normal', 9.5, theme.muted);
    doc.text(label, x + 4, cy);
    setFont(doc, theme, 'bold', 9.5, theme.text);
    doc.text(value, x + boxW - 4, cy, { align: 'right' });
    cy += rowH;
  });
  const barY = y + bodyH;
  doc.setFillColor(...theme.primary);
  doc.rect(x, barY, boxW, barH, 'F');
  setFont(doc, theme, 'bold', 10, theme.onPrimary);
  doc.text('GRAND TOTAL', x + 4, barY + 7.8);
  setFont(doc, theme, 'bold', 12, theme.accentOnPrimary);
  doc.text(money(theme, commercial.grandTotal), x + boxW - 4, barY + 8, { align: 'right' });
  return barY + barH;
}

// ── BOQ ─────────────────────────────────────────────────────────────────────────

const BOQ_COLS = { sno: 12, qty: 17, unit: 16, rate: 27, amount: 30 };
const BOQ_DESC_W = CONTENT_W - Object.values(BOQ_COLS).reduce((a, b) => a + b, 0);

// Height autoTable will give a row of wrapped text at `size` pt (used to avoid orphaned section titles).
// Proper layout measurement, not a hardcoded guess: mirrors autoTable's own line-height
// (1.15x font size, pt→mm via 0.3528) and each row style's real cell padding, so a row's
// height can be estimated accurately before autoTable ever lays it out. `padding` is the
// row's top+bottom cellPadding — pass the same numbers used in that row's own styles.
function measureRowHeight(ctx: PdfCtx, text: string, colW: number, fontSize: number, padding: number): number {
  setFont(ctx.doc, ctx.theme, 'normal', fontSize);
  const lines = (ctx.doc.splitTextToSize(text, colW - 4) as string[]).length;
  return lines * fontSize * 1.15 * 0.3528 + padding;
}

// BOQ row styles, kept in sync with the autoTable config in drawBOQ below — these are
// the exact font sizes and cellPadding (top+bottom) used there, so the estimate matches
// what autoTable will actually draw.
const BOQ_ROW_FONT = 8.5;
const BOQ_BODY_PAD = 1.9 + 1.9;
const BOQ_HEAD_TITLE_FONT = 9;
const BOQ_HEAD_TITLE_PAD = 2.4 + 2.4;
const BOQ_HEAD_COL_FONT = 7.5;
const BOQ_HEAD_COL_PAD = 1.8 + 1.8;
// Small bias toward over-estimating a section's height: costs an occasional extra page
// break in a borderline case, but never risks the opposite — an under-estimate that lets
// a section start somewhere it doesn't actually fit, splitting it after all.
const SECTION_HEIGHT_SAFETY_MARGIN = 2;

// The full height a section's table would take — title bar + column headers + every
// item (note rows use the wider no-sno column) + the section-total row, if it has any
// priced items. Computed from the section's complete item list, not just the first row,
// so the caller can decide up front whether the WHOLE section fits where the cursor is.
function measureSectionHeight(ctx: PdfCtx, section: BOQSection, titleText: string): number {
  const titleH = measureRowHeight(ctx, titleText, CONTENT_W, BOQ_HEAD_TITLE_FONT, BOQ_HEAD_TITLE_PAD);
  const colHeadH = measureRowHeight(ctx, 'Description', BOQ_DESC_W, BOQ_HEAD_COL_FONT, BOQ_HEAD_COL_PAD);
  let bodyH = 0;
  let hasPriced = false;
  section.items.forEach((item) => {
    const note = isNoteItem(item);
    if (!note) hasPriced = true;
    const colW = note ? CONTENT_W - BOQ_COLS.sno : BOQ_DESC_W;
    bodyH += measureRowHeight(ctx, glueFragileTokens(item.description), colW, BOQ_ROW_FONT, BOQ_BODY_PAD);
  });
  const footH = hasPriced ? measureRowHeight(ctx, 'Section total', BOQ_COLS.amount, BOQ_ROW_FONT, BOQ_BODY_PAD) : 0;
  return titleH + colHeadH + bodyH + footH + SECTION_HEIGHT_SAFETY_MARGIN;
}

function drawBOQ(ctx: PdfCtx, q: Quotation, startY: number): number {
  const { doc, theme } = ctx;
  const cur = theme.rupee;
  let y = sectionHeading(ctx, 'Bill of quantities', startY);

  q.boqSections.forEach((section, sIdx) => {
    const letter = sectionLetter(sIdx);
    const titleText = `${letter}.  ${section.title.toUpperCase()}`;

    // Measure the WHOLE section — heading, column headers, every item, and its total —
    // before drawing anything. A section that fits in what's left on the page (or on a
    // fresh one) always stays together; only a section taller than a full page's
    // content area is ever allowed to span pages (and that's a natural consequence of
    // starting it on a fresh page and still running out of room — no special-casing
    // needed for it below).
    const sectionH = measureSectionHeight(ctx, section, titleText);
    // The first section always starts right after the "Bill of Quantities" heading,
    // itself always on a fresh page — so moving section 0 to ANOTHER fresh page would
    // gain it no extra room, and would strand the already-drawn heading alone on the
    // page it left behind. Only sections after the first (where the current page may
    // genuinely have less space left than a full fresh one) can meaningfully benefit
    // from moving.
    if (sIdx > 0 && sectionH > MAX_Y - y) {
      y = newPage(ctx);
    }

    let n = 0;
    const body = section.items.map((item) => {
      if (isNoteItem(item)) {
        return [
          '',
          { content: glueFragileTokens(item.description), colSpan: 5, styles: { fontStyle: 'italic', textColor: theme.muted } },
        ];
      }
      n += 1;
      return [
        String(n),
        glueFragileTokens(item.description),
        qtyFmt(Number(item.quantity)),
        unitLabel(item.unit),
        num2(Number(item.rate)),
        num2(calcItemAmount(item)),
      ];
    });
    const total = calcSectionSubtotal(section);
    const hasPriced = section.items.some((i) => !isNoteItem(i));

    autoTable(doc, {
      startY: y,
      head: [
        [{ content: `${letter}.  ${section.title.toUpperCase()}`, colSpan: 6, styles: { fillColor: theme.primary, textColor: theme.onPrimary, fontStyle: 'bold', fontSize: 9, halign: 'left', cellPadding: { top: 2.4, bottom: 2.4, left: 3, right: 2 } } }],
        [
          { content: 'S.No', styles: { halign: 'center' } },
          { content: 'Description', styles: { halign: 'left' } },
          { content: 'Qty', styles: { halign: 'right' } },
          { content: 'Unit', styles: { halign: 'center' } },
          { content: `Rate (${cur})`, styles: { halign: 'right' } },
          { content: `Amount (${cur})`, styles: { halign: 'right' } },
        ],
      ],
      body: body as any,
      foot: hasPriced ? [[{ content: 'Section total', colSpan: 5, styles: { halign: 'right' } }, num2(total)]] : undefined,
      theme: 'grid',
      showHead: 'everyPage',
      // The total must appear exactly once, after the section's last item — not at the
      // bottom of every page the section happens to span (autoTable's default).
      showFoot: 'lastPage',
      rowPageBreak: 'avoid',
      styles: { font: theme.font, fontSize: 8.5, textColor: theme.text, lineColor: theme.border, lineWidth: 0.15, valign: 'top', overflow: 'linebreak', cellPadding: { top: 1.9, bottom: 1.9, left: 2, right: 2 } },
      headStyles: { fillColor: theme.tint, textColor: theme.muted, fontStyle: 'bold', fontSize: 7.5, valign: 'middle', cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 } },
      footStyles: { fillColor: theme.tint, textColor: theme.heading, fontStyle: 'bold', halign: 'right' },
      columnStyles: {
        0: { cellWidth: BOQ_COLS.sno, halign: 'center' },
        1: { cellWidth: BOQ_DESC_W },
        2: { cellWidth: BOQ_COLS.qty, halign: 'right' },
        3: { cellWidth: BOQ_COLS.unit, halign: 'center' },
        4: { cellWidth: BOQ_COLS.rate, halign: 'right' },
        5: { cellWidth: BOQ_COLS.amount, halign: 'right' },
      },
      margin: TABLE_MARGIN,
      willDrawPage: () => ensureContHeader(ctx),
      // Only reached when a section is genuinely taller than a full page (the measured-
      // height check above already keeps every other section on one page) — marks the
      // repeated heading on each later page as a continuation, not a second section.
      // willDrawCell (not didParseCell) because the head row is one shared cell model
      // redrawn once per physical page it lands on; didParseCell runs once at parse
      // time, before pagination exists, so it can't tell pages apart. data.pageNumber
      // here is relative to THIS table's own pagination (1 for its first page, 2 for
      // its second, ...), not the absolute document page — so > 1 is "a later page of
      // this same section", regardless of which document page that actually is.
      willDrawCell: (data: any) => {
        if (data.row.section === 'head' && data.row.index === 0) {
          data.cell.text = [data.pageNumber > 1 ? `${titleText}  (CONTINUED)` : titleText];
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  });

  // Grand total bar — never orphaned from the last section
  y = ensureSpace(ctx, y, 14);
  doc.setFillColor(...theme.primary);
  doc.rect(MARGIN, y, CONTENT_W, 11, 'F');
  setFont(doc, theme, 'bold', 10, theme.onPrimary);
  doc.text('BOQ GRAND TOTAL', MARGIN + 4, y + 7.3);
  setFont(doc, theme, 'bold', 11, theme.accentOnPrimary);
  doc.text(money(theme, calcBOQSubtotal(q.boqSections)), PAGE_W - MARGIN - 4, y + 7.5, { align: 'right' });
  return y + 11;
}

// ── Text sections ───────────────────────────────────────────────────────────────

function drawSpecs(ctx: PdfCtx, y: number, specs: Quotation['specifications']): number {
  const { doc, theme } = ctx;
  y = sectionHeading(ctx, 'Material & work specifications', y);
  specs.forEach((s) => {
    if (s.title) {
      y = ensureSpace(ctx, y, 14);
      setFont(doc, theme, 'bold', 9, theme.heading);
      doc.text(s.title, MARGIN, y);
      y += 4.6;
    }
    setFont(doc, theme, 'normal', 9, theme.text);
    (doc.splitTextToSize(glueFragileTokens(s.description), CONTENT_W) as string[]).forEach((line) => {
      y = ensureSpace(ctx, y, 6);
      doc.text(line, MARGIN, y);
      y += 4.5;
    });
    y += 2.5;
  });
  return y;
}

// Inclusions and exclusions side by side — halves the vertical space and aligns the rows.
function drawScope(ctx: PdfCtx, y0: number, inc: string[], exc: string[]): number {
  const { doc, theme } = ctx;
  let y = sectionHeading(ctx, 'Scope of work', y0);
  const both = inc.length > 0 && exc.length > 0;
  const rows = Math.max(inc.length, exc.length);
  const label = (list: string[], i: number) => (list[i] ? `${i + 1}.  ${list[i]}` : '');

  const head = both
    ? [['Inclusions', 'Exclusions / client scope']]
    : [[inc.length ? 'Inclusions' : 'Exclusions / client scope']];
  const body = Array.from({ length: rows }, (_, i) =>
    both ? [label(inc, i), label(exc, i)] : [label(inc.length ? inc : exc, i)]);

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: 'grid',
    styles: { font: theme.font, fontSize: 8.5, textColor: theme.text, lineColor: theme.border, lineWidth: 0.15, cellPadding: { top: 1.6, bottom: 1.6, left: 2.5, right: 2.5 }, valign: 'top' },
    headStyles: { fillColor: theme.primary, textColor: theme.onPrimary, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    rowPageBreak: 'avoid',
    margin: TABLE_MARGIN,
    willDrawPage: () => ensureContHeader(ctx),
  });
  return (doc as any).lastAutoTable.finalY;
}

function drawPayment(ctx: PdfCtx, q: Quotation, grandTotal: number, y: number): number {
  const { doc, theme } = ctx;
  y = sectionHeading(ctx, 'Payment schedule', y);
  const totalAmt = q.paymentSchedule.reduce((s, st) => s + calcPaymentAmount(st, grandTotal), 0);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Stage', '%', `Payable amount (${theme.rupee})`, 'Notes']],
    body: q.paymentSchedule.map((st, i) => [
      String(i + 1), st.name, `${qtyFmt(st.percentage)}%`, num2(calcPaymentAmount(st, grandTotal)), st.notes || '',
    ]),
    foot: [['', 'Total', `${qtyFmt(calcPaymentPercentTotal(q.paymentSchedule))}%`, num2(totalAmt), '']],
    showFoot: 'lastPage',
    theme: 'grid',
    styles: { font: theme.font, fontSize: 8.5, textColor: theme.text, lineColor: theme.border, lineWidth: 0.15, cellPadding: { top: 1.9, bottom: 1.9, left: 2, right: 2 }, valign: 'top' },
    headStyles: { fillColor: theme.primary, textColor: theme.onPrimary, fontStyle: 'bold' },
    footStyles: { fillColor: theme.tint, textColor: theme.heading, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
    rowPageBreak: 'avoid',
    margin: TABLE_MARGIN,
    willDrawPage: () => ensureContHeader(ctx),
  });
  return (doc as any).lastAutoTable.finalY;
}

function drawBank(ctx: PdfCtx, s: CompanySettings, y: number): number {
  const rows = [
    { label: 'Account name', value: s.accountName },
    { label: 'Bank', value: s.bankName },
    { label: 'Account no.', value: s.accountNumber },
    { label: 'IFSC', value: s.ifsc },
    { label: 'Branch', value: s.branch },
    { label: 'UPI ID', value: s.upiId },
  ].filter((r) => r.value);
  if (rows.length === 0) return y - 8;
  const card = cardLayout(ctx, CONTENT_W, 'Payment details', rows, 30);
  y = ensureSpace(ctx, y, card.height + 2);
  card.draw(MARGIN, y);
  return y + card.height;
}

function drawTerms(ctx: PdfCtx, q: Quotation, y: number): number {
  const { doc, theme } = ctx;
  y = sectionHeading(ctx, 'Terms & conditions', y);
  q.terms.forEach((term, i) => {
    const lines = doc.splitTextToSize(glueFragileTokens(term.text), CONTENT_W - 8) as string[];
    y = ensureSpace(ctx, y, Math.min(lines.length, 2) * 4.5 + 2);
    setFont(doc, theme, 'bold', 9, theme.heading);
    doc.text(`${i + 1}.`, MARGIN, y);
    setFont(doc, theme, 'normal', 9, theme.text);
    lines.forEach((line) => {
      y = ensureSpace(ctx, y, 6);
      doc.text(line, MARGIN + 7, y);
      y += 4.5;
    });
    y += 1.8;
  });
  return y;
}

function drawNotes(ctx: PdfCtx, q: Quotation, y: number): number {
  const { doc, theme } = ctx;
  y = sectionHeading(ctx, 'Notes', y);
  setFont(doc, theme, 'normal', 9, theme.text);
  (doc.splitTextToSize(q.customerNotes, CONTENT_W) as string[]).forEach((line) => {
    y = ensureSpace(ctx, y, 6);
    doc.text(line, MARGIN, y);
    y += 4.5;
  });
  return y;
}

// ── Acceptance & signature ──────────────────────────────────────────────────────

function drawAcceptance(ctx: PdfCtx, s: CompanySettings, y: number) {
  const { doc, theme } = ctx;
  y = sectionHeading(ctx, 'Acceptance & signature', y);

  const leftW = 88;
  const rightW = 76;
  const rightX = PAGE_W - MARGIN - rightW;

  // Client acceptance (left)
  setFont(doc, theme, 'normal', 8.5, theme.muted);
  const accept = doc.splitTextToSize(
    'I/We hereby accept the above quotation and agree to the terms and conditions. The work shall commence upon receipt of the first payment.',
    leftW,
  ) as string[];
  doc.text(accept, MARGIN, y);
  let ly = y + accept.length * 4.3 + 10;
  ['Name', 'Signature', 'Date'].forEach((label) => {
    doc.setDrawColor(...theme.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN + 20, ly, MARGIN + leftW, ly);
    setFont(doc, theme, 'normal', 8.5, theme.muted);
    doc.text(label, MARGIN, ly - 1);
    ly += 11;
  });

  // Authorized signatory (right) — company name wraps/shrinks instead of running off the page
  const forName = wrapShrink(doc, theme, `For ${ctx.companyName}`, rightW, 2, 9.5, 8);
  setFont(doc, theme, 'bold', forName.size, theme.heading);
  let ry = y + 1;
  forName.lines.forEach((line) => { doc.text(line, rightX, ry); ry += forName.size * 0.45; });

  const sigTop = ry + 1;
  if (s.signatureImage) drawImageFit(doc, s.signatureImage, rightX, sigTop, 44, 17);
  const lineY = sigTop + 19;
  doc.setDrawColor(...theme.border);
  doc.setLineWidth(0.3);
  doc.line(rightX, lineY, rightX + rightW, lineY);

  let sy = lineY + 4.5;
  if (s.authorizedPersonName) {
    setFont(doc, theme, 'bold', 9, theme.text);
    doc.text(fitText(doc, theme, s.authorizedPersonName, rightW), rightX, sy);
    sy += 4.3;
  }
  setFont(doc, theme, 'normal', 8.5, theme.muted);
  doc.text(fitText(doc, theme, s.designation || 'Authorized Signatory', rightW), rightX, sy);
}
