// Shared PDF building blocks. Every document type (quotation, receipt, invoice, ...)
// should compose these instead of positioning text by hand, so layout rules —
// width-aware text, aspect-correct logos, one header per page — live in one place.
import type jsPDF from 'jspdf';
import type { PdfTheme, RGB } from './pdfTheme';

export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN = 15;
export const CONTENT_W = PAGE_W - MARGIN * 2;
export const FOOTER_Y = PAGE_H - 12;      // baseline of footer text
export const MAX_Y = FOOTER_Y - 9;         // last usable y for content
export const CONT_START = 20;              // content top on continuation pages
export const TABLE_MARGIN = { left: MARGIN, right: MARGIN, top: CONT_START, bottom: PAGE_H - MAX_Y };

export type FontStyle = 'normal' | 'bold' | 'italic';

export interface PdfCtx {
  doc: jsPDF;
  theme: PdfTheme;
  /** Pages whose continuation header is already drawn (prevents re-stamping). */
  headed: Set<number>;
  /** Short text shown on the right of continuation headers, e.g. the quotation number. */
  docRef: string;
  companyName: string;
  phone?: string;
}

// ── Text & numbers ──────────────────────────────────────────────────────────────

export function setFont(doc: jsPDF, theme: PdfTheme, style: FontStyle = 'normal', size?: number, color?: RGB) {
  doc.setFont(theme.font, style);
  if (size !== undefined) doc.setFontSize(size);
  if (color) doc.setTextColor(color[0], color[1], color[2]);
}

const fmt2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQty = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** 12,34,567.50 — Indian grouping, always two decimals, no symbol (for table cells). */
export const num2 = (n: number) => fmt2.format(Number.isFinite(n) ? n : 0);
export const qtyFmt = (n: number) => fmtQty.format(Number.isFinite(n) ? n : 0);
/** ₹12,34,567.50 (or "Rs. 12,34,567.50" when the ₹ font isn't available). */
export const money = (theme: PdfTheme, n: number) =>
  `${theme.rupee}${theme.unicode ? '' : ' '}${num2(n)}`;

/** Truncate with an ellipsis so the text never exceeds maxW at the current font/size. */
export function fitText(doc: jsPDF, theme: PdfTheme, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + theme.ellipsis) > maxW) t = t.slice(0, -1);
  return t.trimEnd() + theme.ellipsis;
}

/** Largest font size (within [minSize,startSize]) at which `text` wraps to <= maxLines. */
export function wrapShrink(
  doc: jsPDF, theme: PdfTheme, text: string, maxW: number,
  maxLines: number, startSize: number, minSize: number, style: FontStyle = 'bold',
): { lines: string[]; size: number } {
  for (let s = startSize; s >= minSize; s -= 0.5) {
    setFont(doc, theme, style, s);
    const lines: string[] = doc.splitTextToSize(text, maxW);
    if (lines.length <= maxLines) return { lines, size: s };
  }
  setFont(doc, theme, style, minSize);
  const all: string[] = doc.splitTextToSize(text, maxW);
  const kept = all.slice(0, maxLines);
  kept[maxLines - 1] = fitText(doc, theme, all.slice(maxLines - 1).join(' '), maxW);
  return { lines: kept, size: minSize };
}

// jsPDF's splitTextToSize wraps by splitting the string on the literal space character,
// treating "1", ":", "6" in "1 : 6" as three independent words that can land on
// different lines. Joining the fragile parts with a non-breaking space (invisible —
// renders exactly like a normal space) keeps them on one line without changing how the
// text looks. Used for BOQ/spec/term descriptions, which are full of these patterns
// ("230 mm", "1 : 6", "(9 inch)").
const FRAGILE_UNIT = /\b(mm|cm|kg|inch|sq\.?\s?ft|sq\.?\s?mm|sq\.?\s?m)\b/i;
export function glueFragileTokens(text: string): string {
  if (!text) return text;
  let out = text;
  // Ratios: "1 : 6", "1:4" — keep the digits (and the colon, if spaced) together.
  out = out.replace(/(\d+)\s*:\s*(\d+)/g, '$1\u00A0:\u00A0$2');
  // Number + unit pairs: "230 mm", "1450 sq.ft", "9 inch".
  out = out.replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s+${FRAGILE_UNIT.source}`, 'gi'), (_m, num: string, unit: string) =>
    `${num}\u00A0${unit.replace(/\s+/g, '\u00A0')}`);
  // Short parenthetical remarks: "(9 inch)", "(sponge finish)" — keep the whole
  // parenthetical on one line rather than splitting it mid-phrase. Capped at 24 chars
  // so a long aside doesn't become one giant unbreakable block.
  out = out.replace(/\(([^()]{1,24})\)/g, (_m, inner: string) => `(${inner.replace(/ /g, '\u00A0')})`);
  return out;
}

export function sectionLetter(i: number): string {
  let n = i;
  let s = '';
  do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return s;
}

/** "LS / Lump Sum" is too wide for a unit column — show the standard abbreviation. */
export function unitLabel(unit: string): string {
  const u = (unit ?? '').trim();
  return /^ls\b|lump\s*sum/i.test(u) ? 'LS' : u;
}

// ── Logo ────────────────────────────────────────────────────────────────────────

function imageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' | null {
  const m = /^data:image\/([a-z0-9.+-]+);/i.exec(dataUrl);
  const t = m?.[1]?.toLowerCase();
  if (t === 'png') return 'PNG';
  if (t === 'jpeg' || t === 'jpg') return 'JPEG';
  if (t === 'webp') return 'WEBP';
  return null; // svg etc. aren't embeddable — caller falls back to a monogram
}

/** Draws an image scaled to fit inside maxW×maxH, preserving aspect ratio, vertically centered. */
export function drawImageFit(
  doc: jsPDF, dataUrl: string, x: number, y: number, maxW: number, maxH: number,
): { w: number; h: number } | null {
  try {
    const fmt = imageFormat(dataUrl);
    if (!fmt) return null;
    const p = doc.getImageProperties(dataUrl);
    const k = Math.min(maxW / p.width, maxH / p.height);
    const w = p.width * k;
    const h = p.height * k;
    doc.addImage(dataUrl, fmt, x, y + (maxH - h) / 2, w, h);
    return { w, h };
  } catch {
    return null;
  }
}

// Generic placeholder logo — drawn as vector shapes (no image file, so it can never be
// missing or fail to load) in the company's own brand colors, used whenever a company
// hasn't uploaded a logo yet. Fits inside boxW×boxH the same way drawImageFit does, so
// callers don't need separate layout math for the "no logo" case. Shared by the
// quotation and the booking-receipt PDFs (hence plain RGB params, not PdfTheme — the
// receipt file doesn't use the PdfCtx/PdfTheme machinery).
export function drawDefaultLogo(
  doc: jsPDF, primary: RGB, accent: RGB, onPrimary: RGB,
  x: number, y: number, boxW: number, boxH: number,
): { w: number; h: number } {
  const size = Math.min(boxW, boxH);
  const ox = x + (boxW - size) / 2;
  const oy = y + (boxH - size) / 2;
  doc.setDrawColor(...primary);
  // Roof
  doc.setFillColor(...accent);
  doc.triangle(ox, oy + size * 0.38, ox + size * 0.5, oy, ox + size, oy + size * 0.38, 'F');
  // Body
  doc.setFillColor(...primary);
  doc.rect(ox + size * 0.1, oy + size * 0.36, size * 0.8, size * 0.64, 'F');
  // Door + windows
  doc.setFillColor(...onPrimary);
  doc.rect(ox + size * 0.4, oy + size * 0.62, size * 0.2, size * 0.38, 'F');
  doc.rect(ox + size * 0.2, oy + size * 0.5, size * 0.14, size * 0.14, 'F');
  doc.rect(ox + size * 0.66, oy + size * 0.5, size * 0.14, size * 0.14, 'F');
  return { w: size, h: size };
}

// ── Structure ───────────────────────────────────────────────────────────────────

export function sectionHeading(ctx: PdfCtx, title: string, y: number): number {
  const { doc, theme } = ctx;
  setFont(doc, theme, 'bold', 10.5, theme.heading);
  doc.text(title.toUpperCase(), MARGIN, y);
  doc.setLineWidth(0.3);
  doc.setDrawColor(...theme.border);
  doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
  doc.setLineWidth(0.9);
  doc.setDrawColor(...theme.rule);
  doc.line(MARGIN, y + 2, MARGIN + 18, y + 2);
  return y + 8;
}

/** Continuation header — drawn at most once per page, never on page 1. */
export function ensureContHeader(ctx: PdfCtx) {
  const { doc, theme } = ctx;
  const page = doc.getCurrentPageInfo().pageNumber;
  if (page <= 1 || ctx.headed.has(page)) return;
  ctx.headed.add(page);
  doc.setFillColor(...theme.primary);
  doc.rect(0, 0, PAGE_W, 1.6, 'F');
  setFont(doc, theme, 'bold', 8.5, theme.heading);
  const ref = ctx.docRef;
  const refW = doc.getTextWidth(ref) + 4;
  doc.text(fitText(doc, theme, ctx.companyName, CONTENT_W - refW - 6), MARGIN, 9);
  setFont(doc, theme, 'normal', 8.5, theme.muted);
  doc.text(ref, PAGE_W - MARGIN, 9, { align: 'right' });
  doc.setDrawColor(...theme.border);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, 12, PAGE_W - MARGIN, 12);
}

/** Starts a new page (with its continuation header) and returns the content start y. */
export function newPage(ctx: PdfCtx): number {
  ctx.doc.addPage();
  ensureContHeader(ctx);
  return CONT_START;
}

/** If `needed` mm don't fit on the page, start a new one; otherwise return y unchanged. */
export function ensureSpace(ctx: PdfCtx, y: number, needed: number): number {
  return y + needed > MAX_Y ? newPage(ctx) : y;
}

export interface CardRow { label?: string; value: string; strong?: boolean }

/** Two-pass card: measure() first so side-by-side cards can share a height, then draw(). */
export function cardLayout(ctx: PdfCtx, w: number, title: string, rows: CardRow[], labelW = 24) {
  const { doc, theme } = ctx;
  const pad = 4;
  const valueW = w - pad * 2 - labelW;
  const prepared = rows
    .filter((r) => r.value && r.value.trim())
    .map((r) => {
      const strong = !!r.strong;
      setFont(doc, theme, 'bold', strong ? 11 : 9);
      const width = r.label ? valueW : w - pad * 2;
      const lines: string[] = doc.splitTextToSize(r.value, width);
      const lh = strong ? 5.2 : 4.4;
      return { ...r, lines, lh, h: lines.length * lh + 1.2 };
    });
  const height = 11 + prepared.reduce((s, r) => s + r.h, 0) + 2;

  return {
    height,
    draw(x: number, y: number, h = height) {
      doc.setFillColor(...theme.tint);
      doc.setDrawColor(...theme.border);
      doc.setLineWidth(0.25);
      doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
      setFont(doc, theme, 'bold', 7.5, theme.heading);
      doc.text(title.toUpperCase(), x + pad, y + 5.6);
      doc.setDrawColor(...theme.rule);
      doc.setLineWidth(0.7);
      doc.line(x + pad, y + 7.2, x + pad + 12, y + 7.2);
      let cy = y + 12.5;
      prepared.forEach((r) => {
        if (r.label) {
          setFont(doc, theme, 'normal', 8.5, theme.muted);
          doc.text(r.label, x + pad, cy);
        }
        setFont(doc, theme, 'bold', r.strong ? 11 : 9, theme.text);
        doc.text(r.lines, r.label ? x + pad + labelW : x + pad, cy);
        cy += r.h;
      });
    },
  };
}

/** Footer on every page: company · phone (clamped) on the left, page x of y on the right. */
export function addFooters(ctx: PdfCtx, footerText?: string) {
  const { doc, theme } = ctx;
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...theme.border);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4);
    setFont(doc, theme, 'normal', 7.5, theme.muted);
    const pageLabel = `Page ${i} of ${total}`;
    const left = [ctx.companyName, ctx.phone].filter(Boolean).join('  |  ');
    doc.text(fitText(doc, theme, left, CONTENT_W - doc.getTextWidth(pageLabel) - 8), MARGIN, FOOTER_Y);
    doc.text(pageLabel, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' });
    if (footerText && i === total) {
      setFont(doc, theme, 'italic', 7.5, theme.muted);
      doc.text(fitText(doc, theme, footerText, CONTENT_W), PAGE_W / 2, FOOTER_Y + 4, { align: 'center' });
    }
  }
}
