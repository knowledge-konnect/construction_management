// Per-company PDF theme. Every PDF (quotation, receipt, invoice, ...) builds its
// colors from the company's own brand settings so no company ever sees another's
// palette — and so low-contrast brand colors still produce readable documents.

export type RGB = [number, number, number];

export const DEFAULT_PRIMARY = '#0B2857';
export const DEFAULT_ACCENT = '#F4B72B';

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
const INK: RGB = [15, 23, 42];

export interface PdfBrand {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export interface PdfTheme {
  primary: RGB;          // brand color: bars, table headers
  accent: RGB;           // brand accent: thin rules, highlights
  onPrimary: RGB;        // readable text color on top of `primary`
  accentOnPrimary: RGB;  // accent if readable on primary, otherwise onPrimary
  heading: RGB;          // primary, darkened if needed to stay readable on white
  rule: RGB;             // accent for decorative rules (never near-white)
  tint: RGB;             // very light wash of primary (card / banded rows)
  border: RGB;           // light wash of primary (hairlines)
  text: RGB;             // body text
  muted: RGB;            // secondary text
  font: string;          // 'Roboto' when embedded, else 'helvetica'
  rupee: string;         // '₹' with the embedded font, else 'Rs.'
  ellipsis: string;
  unicode: boolean;
}

export function hexToRgb(hex?: string | null): RGB | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
}

// Darken `color` until it reaches `min` contrast against white.
function readableOnWhite(color: RGB, min: number): RGB {
  let c = color;
  for (let i = 0; i < 24 && contrastRatio(c, WHITE) < min; i++) c = mix(c, BLACK, 0.12);
  return c;
}

export function createPdfTheme(brand: PdfBrand, unicodeFont: boolean): PdfTheme {
  const primary = hexToRgb(brand.primaryColor) ?? (hexToRgb(DEFAULT_PRIMARY) as RGB);
  const accent = hexToRgb(brand.secondaryColor) ?? (hexToRgb(DEFAULT_ACCENT) as RGB);

  const onPrimary: RGB = contrastRatio(WHITE, primary) >= contrastRatio(INK, primary) ? WHITE : INK;
  const accentOnPrimary: RGB = contrastRatio(accent, primary) >= 3 ? accent : onPrimary;
  const rule: RGB = contrastRatio(accent, WHITE) >= 1.5 ? accent : mix(primary, WHITE, 0.45);

  return {
    primary,
    accent,
    onPrimary,
    accentOnPrimary,
    heading: readableOnWhite(primary, 4.5),
    rule,
    tint: mix(primary, WHITE, 0.95),
    border: mix(primary, WHITE, 0.82),
    text: [30, 41, 59],
    muted: [100, 116, 139],
    font: unicodeFont ? 'Roboto' : 'helvetica',
    rupee: unicodeFont ? '₹' : 'Rs.',
    ellipsis: unicodeFont ? '…' : '...',
    unicode: unicodeFont,
  };
}
