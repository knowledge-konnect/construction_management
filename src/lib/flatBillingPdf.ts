// Flat Booking Receipt PDF — professional design with logo & signature support.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FlatBilling } from './flatBilling';
import { calcFlatTotal } from './flatBilling';
import type { CompanySettings } from './models';
import { amountToWords, formatDate } from './utils';

// ── Layout constants ──────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ── Colour palette ────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const NAVY: RGB = [11, 40, 87];
const GOLD: RGB = [244, 183, 43];
const TEXT: RGB = [30, 30, 30];
const MUTED: RGB = [100, 100, 100];
const BORDER: RGB = [200, 210, 220];
const WHITE: RGB = [255, 255, 255];
const ORANGE: RGB = [200, 80, 30];
const LIGHT_BG: RGB = [245, 248, 255];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtAmt(n: number): string {
  if (!isFinite(n) || n === 0) return '-';
  return `Rs. ${new Intl.NumberFormat('en-IN').format(Math.round(n))}`;
}

function fmtAmtShort(n: number): string {
  if (!isFinite(n) || n === 0) return '-';
  return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

// ── Fallback logo mark (geometric) ───────────────────────────────────────────
function drawLogoMark(doc: jsPDF, x: number, y: number) {
  doc.setFillColor(220, 90, 30);
  doc.rect(x, y, 8, 10, 'F');
  doc.setFillColor(...NAVY);
  doc.rect(x + 9, y + 3, 5, 7, 'F');
  doc.setFillColor(220, 90, 30);
  doc.rect(x + 15, y + 5, 3, 5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 1, y + 1, 2, 2, 'F');
  doc.rect(x + 4, y + 1, 2, 2, 'F');
  doc.rect(x + 1, y + 5, 2, 2, 'F');
  doc.rect(x + 4, y + 5, 2, 2, 'F');
}

// ── Header ────────────────────────────────────────────────────────────────────
// Returns the y position of the separator line (dynamic based on address length).
function drawHeader(doc: jsPDF, settings: CompanySettings): number {
  // Gold top accent bar
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, PAGE_W, 1.5, 'F');

  // ── Left: Logo + Company Info ──────────────────────────────────────────────
  const logoX = MARGIN;
  const logoY = 5;
  const logoW = 16;
  const logoH = 16;
  const textStartX = MARGIN + logoW + 4;

  // Logo image or fallback mark
  if (settings.logoUrl) {
    try {
      const fmt = settings.logoUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(settings.logoUrl, fmt, logoX, logoY, logoW, logoH);
    } catch {
      drawLogoMark(doc, logoX, logoY + 3);
    }
  } else {
    drawLogoMark(doc, logoX, logoY + 3);
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text(settings.companyName || 'Construction Documents', textStartX, 10);

  // Tagline (amber)
  let leftY = 15;
  if (settings.tagline) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(settings.tagline, textStartX, leftY);
    leftY += 5;
  }

  // GSTIN
  if (settings.gstin) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`GSTIN: ${settings.gstin}`, textStartX, leftY);
  }

  // ── Right: Contact block ───────────────────────────────────────────────────
  // Limit right column width so it doesn't overflow
  const rightColX = PAGE_W / 2 + 8;
  const rightColW = PAGE_W - MARGIN - rightColX;
  let ry = 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT);

  const addrParts = [
    settings.address,
    settings.city,
    [settings.state, settings.pincode].filter(Boolean).join(' - '),
  ].filter(Boolean);

  if (addrParts.length) {
    const addrLine = `Office: ${addrParts.join(', ')}`;
    const wrapped = doc.splitTextToSize(addrLine, rightColW);
    wrapped.forEach((l: string) => {
      doc.text(l, rightColX, ry);
      ry += 4.2;
    });
  }

  const contactParts: string[] = [];
  if (settings.mobile) contactParts.push(`Mob: ${settings.mobile}`);
  if (settings.email) contactParts.push(`Email: ${settings.email}`);
  if (contactParts.length) {
    const contactLine = contactParts.join('  |  ');
    const wrapped = doc.splitTextToSize(contactLine, rightColW);
    wrapped.forEach((l: string) => {
      doc.text(l, rightColX, ry);
      ry += 4.2;
    });
  }
  if (settings.website) {
    const wrapped = doc.splitTextToSize(`Web: ${settings.website}`, rightColW);
    wrapped.forEach((l: string) => {
      doc.text(l, rightColX, ry);
      ry += 4.2;
    });
  }

  // Dynamic separator — leave at least 2mm gap below the tallest column
  const separatorY = Math.max(leftY + 7, ry + 2, 27);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, separatorY, PAGE_W - MARGIN, separatorY);

  return separatorY;
}

function newPage(doc: jsPDF, settings: CompanySettings): number {
  doc.addPage();
  const separatorY = drawHeader(doc, settings);
  return separatorY + 3;
}

function ensurePageSpace(doc: jsPDF, y: number, minHeight: number, settings: CompanySettings): number {
  if (y + minHeight > PAGE_H - 18) {
    return newPage(doc, settings);
  }
  return y;
}

// ── Title banner ──────────────────────────────────────────────────────────────
function drawTitleBanner(doc: jsPDF, y: number): number {
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y, CONTENT_W, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text('FLAT BOOKING RECEIPT', PAGE_W / 2, y + 8.5, { align: 'center' });
  return y + 12;
}

// ── Meta block: Receipt No / Booking ID / Date / Flat ─────────────────────────
// Fixed: right column now shows Date + Flat No instead of duplicating Booking ID.
function drawMetaBlock(doc: jsPDF, billing: FlatBilling, y: number): number {
  y += 5;
  const colW = CONTENT_W / 2 - 5;
  const rx = MARGIN + colW + 10;

  const leftItems: [string, string][] = [
    ['Receipt No.', billing.receiptNumber],
    ['Booking ID', billing.bookingId || '-'],
  ];

  const rightItems: [string, string][] = [
    ['Date', formatDate(billing.date)],
    ['Flat No.', billing.flatNo ? `${billing.flatNo}${billing.floor ? ', ' + billing.floor : ''}${billing.blockTower ? ', ' + billing.blockTower : ''}` : '-'],
  ];

  let ly = y;
  leftItems.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(`${label}:`, MARGIN, ly);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT);
    const labelPx = doc.getTextWidth(`${label}: `);
    doc.text(val, MARGIN + labelPx + 0.5, ly);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, ly + 1.5, MARGIN + colW, ly + 1.5);
    ly += 7;
  });

  let ry = y;
  rightItems.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(`${label}:`, rx, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT);
    const labelPx = doc.getTextWidth(`${label}: `);
    doc.text(val, rx + labelPx + 0.5, ry);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.2);
    doc.line(rx, ry + 1.5, PAGE_W - MARGIN, ry + 1.5);
    ry += 7;
  });

  return y + Math.max(leftItems.length, rightItems.length) * 7 + 4;
}

// ── Buyer details ─────────────────────────────────────────────────────────────
function drawBuyerDetails(doc: jsPDF, billing: FlatBilling, y: number, settings: CompanySettings): number {
  y = ensurePageSpace(doc, y, 30, settings);

  // Section heading with gold underline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text('Buyer Details', MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4);
  y += 9;

  const labelW = 34;
  const valMaxW = CONTENT_W - labelW - 2;

  const rows: [string, string][] = [
    ['Name', billing.buyerName],
    ['Address', billing.buyerAddress],
    ['Phone', billing.buyerPhone],
    ['PAN / Aadhar', billing.buyerPanAadhar],
  ];

  rows.forEach(([label, val]) => {
    if (!val) return;
    const lines = doc.splitTextToSize(val, valMaxW);
    const rowHeight = Math.max(lines.length * 4.5, 6);
    if (y + rowHeight > PAGE_H - 30) {
      y = newPage(doc, settings);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`${label}:`, MARGIN, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT);
    doc.text(lines, MARGIN + labelW, y);

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.15);
    doc.line(MARGIN, y + rowHeight - 0.5, PAGE_W - MARGIN, y + rowHeight - 0.5);
    y += rowHeight + 2;
  });

  return y + 2;
}

// ── Flat details table ────────────────────────────────────────────────────────
function drawFlatDetails(doc: jsPDF, billing: FlatBilling, y: number, settings: CompanySettings): number {
  y = ensurePageSpace(doc, y, 34, settings);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text('Flat Details', MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4);
  y += 7;

  const total = calcFlatTotal(billing);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Flat No.', 'Floor', 'Block / Tower', 'Area (Sq.Ft.)', 'Rate / Sq.Ft. (Rs.)', 'Total Cost (Rs.)']],
    body: [[
      billing.flatNo || '-',
      billing.floor || '-',
      billing.blockTower || '-',
      billing.areaSqft || '-',
      billing.ratePerSqft ? new Intl.NumberFormat('en-IN').format(Number(billing.ratePerSqft)) : '-',
      total ? fmtAmtShort(total) : '-',
    ]],
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5, halign: 'center', cellPadding: 3 },
    bodyStyles: { fontSize: 9, textColor: TEXT, halign: 'center', minCellHeight: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 24 },
      2: { cellWidth: 36 },
      3: { cellWidth: 26 },
      4: { cellWidth: 38 },
      5: { cellWidth: 40 },
    },
    tableLineColor: BORDER,
    tableLineWidth: 0.2,
    alternateRowStyles: { fillColor: LIGHT_BG },
  });

  const nextY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  return ensurePageSpace(doc, nextY, 0, settings);
}

// ── Payment schedule ──────────────────────────────────────────────────────────
function drawPaymentSchedule(doc: jsPDF, billing: FlatBilling, y: number, settings: CompanySettings): number {
  y = ensurePageSpace(doc, y, 40, settings);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text('Payment Schedule', MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4);
  y += 7;

  const paidRows = billing.payments.filter((p) => p.stage.trim());
  const rows = paidRows.map((p) => [
    p.stage || '-',
    p.amount ? fmtAmt(p.amount) : '-',
    p.dueDate ? formatDate(p.dueDate) : '-',
    p.status || '-',
  ]);

  const totalPaid = billing.payments.reduce((s, p) => s + (p.amount || 0), 0);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Payment Stage', 'Amount (Rs.)', 'Due Date', 'Status']],
    body: [
      ...rows,
      [
        { content: 'Total', styles: { fontStyle: 'bold', textColor: WHITE, fillColor: NAVY } },
        { content: fmtAmt(totalPaid), styles: { fontStyle: 'bold', textColor: WHITE, fillColor: NAVY } },
        { content: '', styles: { fillColor: NAVY as unknown as [number, number, number] } },
        { content: '', styles: { fillColor: NAVY as unknown as [number, number, number] } },
      ],
    ],
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9, halign: 'center', cellPadding: 3 },
    bodyStyles: { fontSize: 9, textColor: TEXT, halign: 'center', minCellHeight: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { halign: 'left', cellWidth: 58 },
      1: { cellWidth: 48 },
      2: { cellWidth: 42 },
      3: { cellWidth: 34 },
    },
    tableLineColor: BORDER,
    tableLineWidth: 0.2,
    alternateRowStyles: { fillColor: LIGHT_BG },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader(doc, settings);
      }
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
}

// ── Amount summary ────────────────────────────────────────────────────────────
function drawAmountSummary(doc: jsPDF, billing: FlatBilling, y: number): number {
  const total = calcFlatTotal(billing);
  if (!total) return y;

  const totalPaid = billing.payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = total - totalPaid;

  const boxH = 28;
  doc.setFillColor(...LIGHT_BG);
  doc.rect(MARGIN, y, CONTENT_W, boxH, 'F');
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y, CONTENT_W, boxH);

  // Left accent stripe
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y, 3, boxH, 'F');

  const labelX = MARGIN + 8;
  const valX = PAGE_W - MARGIN - 4;

  // Row 1: Total Flat Cost
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text('Total Flat Cost:', labelX, y + 8);
  doc.text(fmtAmt(total), valX, y + 8, { align: 'right' });

  // Row 2: Total Paid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  doc.text('Total Paid:', labelX, y + 16);
  doc.text(fmtAmt(totalPaid), valX, y + 16, { align: 'right' });

  // Row 3: Balance Due
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...(balance > 0 ? ORANGE : NAVY));
  doc.text('Balance Due:', labelX, y + 24);
  doc.text(fmtAmt(Math.max(balance, 0)), valX, y + 24, { align: 'right' });

  y += boxH + 4;

  // Amount in words
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const words = doc.splitTextToSize(`Amount in Words: ${amountToWords(total)}`, CONTENT_W);
  doc.text(words, MARGIN, y);
  y += words.length * 5 + 4;

  return y;
}

// ── Terms & conditions ────────────────────────────────────────────────────────
function drawTerms(doc: jsPDF, billing: FlatBilling, y: number, settings: CompanySettings): number {
  if (!billing.terms.some((t) => t.trim())) return y;

  y = ensurePageSpace(doc, y, 30, settings);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text('Terms & Conditions', MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4);
  y += 8;

  billing.terms.forEach((term, i) => {
    if (!term.trim()) return;
    const lines = doc.splitTextToSize(`${i + 1}. ${term}`, CONTENT_W - 2);
    if (y + lines.length * 5 > PAGE_H - 20) {
      y = newPage(doc, settings);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(lines, MARGIN, y);
    y += lines.length * 5 + 1;
  });

  return y + 4;
}

// ── Signature block ───────────────────────────────────────────────────────────
// Now supports signature image on the company side.
function drawSignatureBlock(doc: jsPDF, billing: FlatBilling, settings: CompanySettings, y: number) {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;

  const colW = (CONTENT_W / 2) - 8;
  const rx = MARGIN + colW + 16;

  // ── Left: Company side ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`For ${settings.companyName || 'Construction Documents'}`, MARGIN, y);

  // Signature image (if provided) — shown above the signature line
  if (settings.signatureImage) {
    try {
      const fmt = settings.signatureImage.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      // Draw image above the line: 35mm wide × 18mm tall, positioned so bottom aligns with line
      doc.addImage(settings.signatureImage, fmt, MARGIN, y + 2, 35, 18);
    } catch {
      // silently fall back to blank space
    }
  }

  // ── Right: Buyer side ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Buyer's Signature", rx, y);

  y += 22; // space for signature image / blank

  // Signature lines
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + colW, y);
  doc.line(rx, y, PAGE_W - MARGIN, y);

  y += 5;

  // Left: Authorized name & designation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  const authName = settings.authorizedPersonName || 'AUTHORIZED SIGNATORY';
  doc.text(authName, MARGIN, y);

  if (settings.designation) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(settings.designation, MARGIN, y + 4.5);
  }

  // Right: Buyer name
  if (billing.buyerName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(billing.buyerName, rx, y);
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────
function drawFooter(doc: jsPDF, settings: CompanySettings) {
  doc.setFillColor(...NAVY);
  doc.rect(0, PAGE_H - 9, PAGE_W, 9, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  const txt = settings.footerText
    || [settings.companyName, settings.mobile, settings.email].filter(Boolean).join('  |  ');
  doc.text(txt, PAGE_W / 2, PAGE_H - 3.5, { align: 'center' });
}

// ── Image loader ──────────────────────────────────────────────────────────────
// Fetches a remote URL and returns a base64 data URL for jsPDF.
// Returns null on any failure so callers can gracefully fall back.
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  // Already a data URL — use directly
  if (url.startsWith('data:')) return url;
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

// ── Public entry point ────────────────────────────────────────────────────────
export async function generateFlatBillingPDFImpl(billing: FlatBilling, settings: CompanySettings): Promise<void> {
  // Pre-load images concurrently before building the PDF
  const [logoData, signatureData] = await Promise.all([
    settings.logoUrl ? loadImageAsDataUrl(settings.logoUrl) : Promise.resolve(null),
    settings.signatureImage ? loadImageAsDataUrl(settings.signatureImage) : Promise.resolve(null),
  ]);

  // Inject resolved data URLs so drawHeader/drawSignatureBlock can use them synchronously
  const resolvedSettings: CompanySettings = {
    ...settings,
    logoUrl: logoData ?? undefined,
    signatureImage: signatureData ?? undefined,
  };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const separatorY = drawHeader(doc, resolvedSettings);

  let y = separatorY + 3;
  y = drawTitleBanner(doc, y);
  y = drawMetaBlock(doc, billing, y);
  y = drawBuyerDetails(doc, billing, y, resolvedSettings);
  y = drawFlatDetails(doc, billing, y, resolvedSettings);
  y = drawPaymentSchedule(doc, billing, y, resolvedSettings);
  y = drawAmountSummary(doc, billing, y);
  y = drawTerms(doc, billing, y, resolvedSettings);

  // Ensure enough room for signature block (≈ 42mm)
  if (y > PAGE_H - 52) {
    y = newPage(doc, resolvedSettings);
  }

  drawSignatureBlock(doc, billing, resolvedSettings, y);
  drawFooter(doc, resolvedSettings);

  const name = (billing.buyerName || 'buyer').replace(/\s+/g, '_');
  const num = billing.receiptNumber.replace(/[/\\]/g, '-');
  doc.save(`FlatReceipt-${num}-${name}.pdf`);
}
