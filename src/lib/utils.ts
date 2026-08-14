// Formatting, calculation, and helper utilities — simplified for MVP.

import { v4 as uuid } from 'uuid';
import type {
  AdditionalCharge,
  BOQItem,
  BOQSection,
  CompanySettings,
  Discount,
  PaymentStage,
  Questionnaire,
  Quotation,
  Specification,
} from './models';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  if (!isFinite(amount)) return '₹0';
  return inrFormatter.format(round2(amount));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatNumber(n: number): string {
  if (!isFinite(n)) return '0';
  const r = round2(n);
  if (Number.isInteger(r)) return String(r);
  return String(r);
}

export function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function calcItemAmount(item: BOQItem): number {
  return round2((Number(item.quantity) || 0) * (Number(item.rate) || 0));
}

export function calcSectionSubtotal(section: BOQSection): number {
  return round2(section.items.reduce((sum, i) => sum + calcItemAmount(i), 0));
}

export function calcBOQSubtotal(sections: BOQSection[]): number {
  return round2(sections.reduce((sum, s) => sum + calcSectionSubtotal(s), 0));
}

export function calcAdditionalCharges(charges: AdditionalCharge[]): number {
  return round2(charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0));
}

export function calcDiscountAmount(discount: Discount, base: number): number {
  if (discount.type === 'Percentage') {
    return round2((base * (Number(discount.value) || 0)) / 100);
  }
  if (discount.type === 'Fixed Amount') {
    return round2(Number(discount.value) || 0);
  }
  return 0;
}

export interface CommercialSummary {
  boqSubtotal: number;
  additionalCharges: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
}

export function calcCommercial(q: Quotation): CommercialSummary {
  const boqSubtotal = calcBOQSubtotal(q.boqSections);
  const additionalCharges = calcAdditionalCharges(q.additionalCharges);
  const baseForDiscount = round2(boqSubtotal + additionalCharges);
  const discountAmount = calcDiscountAmount(q.discount, baseForDiscount);
  const taxableAmount = round2(baseForDiscount - discountAmount);

  let taxAmount = 0;
  let grandTotal = taxableAmount;
  if (q.tax.applicable && q.tax.rate > 0) {
    taxAmount = round2((taxableAmount * q.tax.rate) / 100);
    grandTotal = round2(taxableAmount + taxAmount);
  }

  return {
    boqSubtotal,
    additionalCharges,
    discountAmount,
    taxableAmount,
    taxAmount,
    grandTotal,
  };
}

export function calcPaymentAmount(stage: PaymentStage, grandTotal: number): number {
  return round2((grandTotal * (Number(stage.percentage) || 0)) / 100);
}

export function calcPaymentPercentTotal(schedule: PaymentStage[]): number {
  return round2(schedule.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0));
}

// Amount to words - Indian system
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

export function amountToWords(amount: number): string {
  if (amount === 0) return 'Rupees Zero Only';
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let n = rupees;
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const hundred = Math.floor(n / 100); n %= 100;
  const rest = n;
  const segs: string[] = [];
  if (crore) segs.push(`${twoDigits(crore)} Crore`);
  if (lakh) segs.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) segs.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) segs.push(`${ones[hundred]} Hundred`);
  if (rest) segs.push(twoDigits(rest));
  let words = segs.join(' ').trim();
  words = 'Rupees ' + words + (paise ? ` and ${twoDigits(paise)} Paise` : '') + ' Only';
  return words;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Convert questionnaire answers into Specification entries for the PDF.
export function questionnaireToSpecs(q: Questionnaire): Specification[] {
  const specs: Specification[] = [];
  let order = 0;
  const add = (title: string, description: string) => {
    if (description.trim()) specs.push({ id: uuid(), title, description, displayOrder: order++ });
  };

  add('Structure', [
    q.structureType && `Structure Type: ${q.structureType}`,
    q.foundationType && `Foundation: ${q.foundationType}`,
    q.floorsPlanned && `Floors Planned: ${q.floorsPlanned}`,
    q.plotSize && `Plot Size: ${q.plotSize}`,
  ].filter(Boolean).join('. '));

  add('Cement & Concrete', [
    q.cementBrand && `Cement: ${q.cementBrand}`,
    q.concreteMix && `Concrete Mix: ${q.concreteMix}`,
  ].filter(Boolean).join('. '));

  add('Reinforcement Steel', [
    q.steelBrand && `Brand: ${q.steelBrand}`,
    q.steelGrade && `Grade: ${q.steelGrade}`,
  ].filter(Boolean).join('. '));

  add('Flooring', [
    q.flooringType && `Type: ${q.flooringType}`,
    q.flooringBrand && `Brand: ${q.flooringBrand}`,
  ].filter(Boolean).join('. '));

  add('Wall Finish & Paint', [
    q.wallFinish && `Wall Finish: ${q.wallFinish}`,
    q.paintBrand && `Paint: ${q.paintBrand}`,
    q.paintType && `Paint Type: ${q.paintType}`,
  ].filter(Boolean).join('. '));

  add('Doors & Windows', [
    q.doorsType && `Doors: ${q.doorsType}`,
    q.windowsType && `Windows: ${q.windowsType}`,
  ].filter(Boolean).join('. '));

  add('Electrical', [
    q.wiringBrand && `Wiring: ${q.wiringBrand}`,
    q.switchesBrand && `Switches: ${q.switchesBrand}`,
  ].filter(Boolean).join('. '));

  add('Plumbing & Sanitary', [
    q.plumbingPipes && `Pipes: ${q.plumbingPipes}`,
    q.sanitaryBrand && `Sanitaryware: ${q.sanitaryBrand}`,
  ].filter(Boolean).join('. '));

  return specs.filter((s) => s.description.trim().length > 0);
}

export function isValidMobile(s: string): boolean {
  return /^[6-9]\d{9}$/.test(s.replace(/\s+/g, ''));
}

export function isValidEmail(s: string): boolean {
  return !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function isValidPincode(s: string): boolean {
  return !s || /^\d{6}$/.test(s);
}

export function isValidWebsite(s: string): boolean {
  if (!s) return true;
  const trimmed = s.trim();
  try {
    const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(normalized);
    return !!url.hostname && url.hostname.includes('.');
  } catch {
    return false;
  }
}

export function isValidIFSC(s: string): boolean {
  const code = (s || '').trim().toUpperCase();
  return !code || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(code);
}

export function isValidUPIId(s: string): boolean {
  const id = (s || '').trim();
  return !id || /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(id);
}

export function isValidBankAccountNumber(s: string): boolean {
  const normalized = (s || '').replace(/[\s-]/g, '');
  return !normalized || /^[A-Za-z0-9]{6,24}$/.test(normalized);
}

const GST_STATE_CODES: Record<string, string> = {
  'Andhra Pradesh': '36',
  'Arunachal Pradesh': '12',
  Assam: '18',
  Bihar: '10',
  Chhattisgarh: '22',
  Goa: '29',
  Gujarat: '24',
  Haryana: '06',
  'Himachal Pradesh': '02',
  Jharkhand: '20',
  Karnataka: '28',
  Kerala: '31',
  'Madhya Pradesh': '23',
  Maharashtra: '27',
  Manipur: '14',
  Meghalaya: '17',
  Mizoram: '15',
  Nagaland: '13',
  Odisha: '21',
  Punjab: '03',
  Rajasthan: '08',
  Sikkim: '11',
  'Tamil Nadu': '32',
  Telangana: '35',
  Tripura: '16',
  'Uttar Pradesh': '09',
  Uttarakhand: '05',
  'West Bengal': '19',
  Delhi: '07',
  'Jammu and Kashmir': '01',
  Ladakh: '38',
  Puducherry: '33',
};

export function getGSTStateCode(state: string): string | undefined {
  return GST_STATE_CODES[state];
}

export function isValidPAN(s: string): boolean {
  const pan = (s || '').trim().toUpperCase();
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
}

export function isValidGSTIN(value: string, state?: string): boolean {
  const gstin = (value || '').replace(/\s+/g, '').toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    return false;
  }
  if (state) {
    const expected = getGSTStateCode(state);
    return !expected || gstin.slice(0, 2) === expected;
  }
  return true;
}

export function validateCompanySettings(settingsToValidate: CompanySettings): Record<string, string> {
  const nextErrors: Record<string, string> = {};

  if (!settingsToValidate.companyName.trim()) {
    nextErrors.companyName = 'Company name is required.';
  }
  if (settingsToValidate.mobile && !isValidMobile(settingsToValidate.mobile)) {
    nextErrors.mobile = 'Enter a valid 10-digit Indian mobile number.';
  }
  if (settingsToValidate.email && !isValidEmail(settingsToValidate.email)) {
    nextErrors.email = 'Enter a valid email address.';
  }
  if (settingsToValidate.website && !isValidWebsite(settingsToValidate.website)) {
    nextErrors.website = 'Enter a valid website URL.';
  }
  if (settingsToValidate.pincode && !isValidPincode(settingsToValidate.pincode)) {
    nextErrors.pincode = 'PIN code must be 6 digits.';
  }
  if (settingsToValidate.ifsc && !isValidIFSC(settingsToValidate.ifsc)) {
    nextErrors.ifsc = 'IFSC must be 11 characters, e.g. HDFC0001234.';
  }
  if (settingsToValidate.accountNumber && !isValidBankAccountNumber(settingsToValidate.accountNumber)) {
    nextErrors.accountNumber = 'Enter a valid bank account number.';
  }
  if (settingsToValidate.upiId && !isValidUPIId(settingsToValidate.upiId)) {
    nextErrors.upiId = 'Enter a valid UPI ID, e.g. username@bank.';
  }
  if (settingsToValidate.pan && !isValidPAN(settingsToValidate.pan)) {
    nextErrors.pan = 'PAN must be 10 chars like ABCDE1234F.';
  }
  if (settingsToValidate.gstin && !isValidGSTIN(settingsToValidate.gstin, settingsToValidate.state)) {
    const expected = getGSTStateCode(settingsToValidate.state);
    nextErrors.gstin = expected
      ? `GSTIN should start with ${expected} for ${settingsToValidate.state}.`
      : 'Invalid GSTIN format.';
  }
  if (!settingsToValidate.defaultValidity) {
    nextErrors.defaultValidity = 'Default validity is required.';
  }
  if (!settingsToValidate.defaultState) {
    nextErrors.defaultState = 'Default state is required.';
  }
  if (!Number.isFinite(settingsToValidate.defaultTaxRate) || settingsToValidate.defaultTaxRate < 0) {
    nextErrors.defaultTaxRate = 'Enter a valid default tax rate.';
  }

  return nextErrors;
}

export function validityDays(validity: string): number {
  const m = validity.match(/^(\d+)\s*Days?$/i);
  if (m) return parseInt(m[1], 10);
  return 30;
}

export function calcValidUntil(dateISO: string, validity: string): string {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + validityDays(validity));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
