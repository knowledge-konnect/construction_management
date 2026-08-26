// Core domain models — simplified for MVP.

export type QuotationStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export interface Customer {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Project {
  name: string;
  projectType: string;
  builtupArea: string;
  builtupAreaUnit: string;
  floors: string;
  address: string;
  city: string;
  state: string;
}

export interface BOQItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  displayOrder: number;
}

export interface BOQSection {
  id: string;
  title: string;
  displayOrder: number;
  items: BOQItem[];
}

export interface Specification {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
}

export interface AdditionalCharge {
  id: string;
  description: string;
  amount: number;
}

export interface Discount {
  type: 'None' | 'Percentage' | 'Fixed Amount';
  value: number;
}

export interface Tax {
  applicable: boolean;
  name: string;
  rate: number;
}

export interface PaymentStage {
  id: string;
  name: string;
  percentage: number;
  notes: string;
  amount?: number;
  dueDate?: string | null;
  status?: string | null;
  displayOrder: number;
}

export interface Term {
  id: string;
  text: string;
  displayOrder: number;
}

export interface Questionnaire {
  // Project / Structure
  structureType: string;
  foundationType: string;
  floorsPlanned: string;
  plotSize: string;
  // Materials
  cementBrand: string;
  steelBrand: string;
  steelGrade: string;
  concreteMix: string;
  // Finishes
  flooringType: string;
  flooringBrand: string;
  wallFinish: string;
  paintBrand: string;
  paintType: string;
  // Doors & Windows
  doorsType: string;
  windowsType: string;
  // Electrical & Plumbing
  wiringBrand: string;
  switchesBrand: string;
  plumbingPipes: string;
  sanitaryBrand: string;
  // Inclusions / Exclusions (free-form additions beyond the checkbox lists)
  extraInclusions: string;
  extraExclusions: string;
}

export interface QuestionnaireRecord {
  id: string;
  title: string;
  customerName: string;
  projectName: string;
  questionnaire: Questionnaire;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  status: QuotationStatus;
  quotationDate: string;
  validUntil: string;
  validity: string;
  customer: Customer;
  project: Project;
  questionnaire: Questionnaire;
  boqSections: BOQSection[];
  specifications: Specification[];
  inclusions: string[];
  exclusions: string[];
  additionalCharges: AdditionalCharge[];
  discount: Discount;
  tax: Tax;
  paymentSchedule: PaymentStage[];
  terms: Term[];
  customerNotes: string;
  internalNotes: string;
  subtotal: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  generatedAt: string | null;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  contactPerson: string;
  mobile: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan?: string;
  logoUrl?: string;
  signatureImage?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
  showBankOnPdf: boolean;
  prefix: string;
  defaultValidity: string;
  defaultState: string;
  defaultTaxName: string;
  defaultTaxRate: number;
  defaultTerms: Term[];
  authorizedPersonName: string;
  designation: string;
  footerText: string;
  bookingPrefix?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  projectType: string;
  boqSections: BOQSection[];
  specifications: Specification[];
  defaultInclusions: string[];
  defaultExclusions: string[];
  createdAt: string;
  updatedAt: string;
}
