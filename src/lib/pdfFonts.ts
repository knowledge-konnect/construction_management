// Embeds Roboto (Apache-2.0) so PDFs can use the ₹ glyph and consistent typography.
// The TTFs live in /public/fonts and are fetched once, only when a PDF is generated.
// If they can't be loaded the PDF falls back to Helvetica with "Rs." — never fails.
import type jsPDF from 'jspdf';

export interface PdfFontData {
  regular: string; // base64
  bold: string;
  italic: string;
}

export type PdfFontLoader = (file: string) => Promise<ArrayBuffer | Uint8Array>;

const FILES = { regular: 'Roboto-Regular.ttf', bold: 'Roboto-Bold.ttf', italic: 'Roboto-Italic.ttf' } as const;

async function browserLoader(file: string): Promise<ArrayBuffer> {
  const base = (import.meta as any).env?.BASE_URL ?? '/';
  const res = await fetch(`${base}fonts/${file}`);
  if (!res.ok) throw new Error(`Font ${file} failed to load (${res.status})`);
  return res.arrayBuffer();
}

let loader: PdfFontLoader = browserLoader;
let cached: Promise<PdfFontData> | null = null;

// Lets non-browser callers (tests, scripts, server-side rendering) supply the bytes.
export function setPdfFontLoader(custom: PdfFontLoader) {
  loader = custom;
  cached = null;
}

function toBase64(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

export async function loadPdfFonts(): Promise<PdfFontData | null> {
  if (!cached) {
    cached = (async () => {
      const [regular, bold, italic] = await Promise.all(
        [FILES.regular, FILES.bold, FILES.italic].map(async (f) => toBase64(await loader(f))),
      );
      return { regular, bold, italic };
    })();
  }
  try {
    return await cached;
  } catch {
    cached = null; // allow a retry next time
    return null;
  }
}

export function registerPdfFonts(doc: jsPDF, fonts: PdfFontData) {
  doc.addFileToVFS(FILES.regular, fonts.regular);
  doc.addFont(FILES.regular, 'Roboto', 'normal');
  doc.addFileToVFS(FILES.bold, fonts.bold);
  doc.addFont(FILES.bold, 'Roboto', 'bold');
  doc.addFileToVFS(FILES.italic, fonts.italic);
  doc.addFont(FILES.italic, 'Roboto', 'italic');
}
