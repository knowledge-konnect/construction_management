// Default values and factory functions — simplified for MVP.

import { v4 as uuid } from 'uuid';
import {
  EXCLUSION_SUGGESTIONS,
  INCLUSION_SUGGESTIONS,
} from './constants';
import type {
  BOQItem,
  BOQSection,
  CompanySettings,
  Customer,
  Project,
  Questionnaire,
  Quotation,
  Specification,
  Template,
  Term,
} from './models';

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: '',
  tagline: '',
  contactPerson: '',
  mobile: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: 'Andhra Pradesh',
  pincode: '',
  gstin: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  ifsc: '',
  branch: '',
  upiId: '',
  showBankOnPdf: false,
  prefix: 'DOC/QTN',
  defaultValidity: '30 Days',
  defaultState: 'Andhra Pradesh',
  defaultTaxName: 'GST',
  defaultTaxRate: 0,
  defaultTerms: defaultTerms(),
  authorizedPersonName: '',
  designation: 'Authorized Signatory',
  footerText: 'Thank you for considering our services.',
  bookingPrefix: 'DOC/RCP',
  primaryColor: '#0B2857',
  secondaryColor: '#F4B72B',
  logoUrl: '',
  signatureImage: '',
  pan: '',
};

function defaultTerms(): Term[] {
  return [
    'This quotation is valid for 30 days from the quotation date. Rates are subject to revision after the validity period.',
    'Payments shall be made as per the agreed payment schedule. Applicable taxes shall be paid extra as per government rules.',
    'Any work outside the approved scope, or changes requested after work commences, will be charged additionally at mutually agreed rates.',
    'Quoted rates are based on prevailing material prices. Significant variations in material cost may be adjusted as mutually agreed.',
    'The client shall provide clear site access, approved drawings, and necessary permissions to avoid delays.',
  ].map((text, i) => ({
    id: uuid(),
    text,
    displayOrder: i,
  }));
}

export function defaultCustomer(): Customer {
  return {
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: 'Andhra Pradesh',
    pincode: '',
  };
}

export function defaultProject(): Project {
  return {
    name: '',
    projectType: 'Individual House',
    builtupArea: '',
    builtupAreaUnit: 'Sq.ft',
    floors: 'G+1',
    address: '',
    city: '',
    state: 'Andhra Pradesh',
  };
}

export function newBOQItem(order: number): BOQItem {
  return {
    id: uuid(),
    description: '',
    quantity: 0,
    unit: 'Nos',
    rate: 0,
    amount: 0,
    displayOrder: order,
  };
}

export function newBOQSection(title: string, order: number): BOQSection {
  return {
    id: uuid(),
    title,
    displayOrder: order,
    items: [],
  };
}

export function newSpecification(order: number): Specification {
  return {
    id: uuid(),
    title: '',
    description: '',
    displayOrder: order,
  };
}

export function defaultQuestionnaire(): Questionnaire {
  return {
    structureType: '',
    foundationType: '',
    floorsPlanned: '',
    plotSize: '',
    cementBrand: '',
    steelBrand: '',
    steelGrade: '',
    concreteMix: '',
    flooringType: '',
    flooringBrand: '',
    wallFinish: '',
    paintBrand: '',
    paintType: '',
    doorsType: '',
    windowsType: '',
    wiringBrand: '',
    switchesBrand: '',
    plumbingPipes: '',
    sanitaryBrand: '',
    extraInclusions: '',
    extraExclusions: '',
  };
}

export function createEmptyQuotation(): Quotation {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    quotationNumber: '',
    status: 'DRAFT',
    quotationDate: todayISODate(),
    validUntil: '',
    validity: '30 Days',
    customer: defaultCustomer(),
    project: defaultProject(),
    questionnaire: defaultQuestionnaire(),
    boqSections: [],
    specifications: [],
    inclusions: [],
    exclusions: [],
    additionalCharges: [],
    discount: { type: 'None', value: 0 },
    tax: { applicable: false, name: 'GST', rate: 0 },
    paymentSchedule: [],
    terms: [],
    customerNotes: '',
    internalNotes: '',
    subtotal: 0,
    grandTotal: 0,
    createdAt: now,
    updatedAt: now,
    generatedAt: null,
  };
}

export function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function defaultTemplates(): Template[] {
  const now = new Date().toISOString();
  const mk = (
    name: string,
    desc: string,
    pt: string,
    sectionNames: string[],
    specs: Array<[string, string]>,
  ): Template => ({
    id: uuid(),
    name,
    description: desc,
    projectType: pt,
    boqSections: sectionNames.map((s, i) => ({
      id: uuid(),
      title: s,
      displayOrder: i,
      items: [newBOQItem(0)],
    })),
    specifications: specs.map(([title, description], i) => ({
      id: uuid(),
      title,
      description,
      displayOrder: i,
    })),
    defaultInclusions: [...INCLUSION_SUGGESTIONS],
    defaultExclusions: [...EXCLUSION_SUGGESTIONS],
    createdAt: now,
    updatedAt: now,
  });

  return [
    mk(
      'Individual House – Standard',
      'Standard BOQ structure for a residential individual house.',
      'Individual House',
      [
        'Preliminaries & Site Setup',
        'Earthwork & Excavation',
        'Foundation',
        'PCC Works',
        'RCC / Structural Works',
        'Masonry',
        'Plastering',
        'Flooring & Tiling',
        'Doors & Windows',
        'Plumbing',
        'Electrical Works',
        'Painting',
      ],
      [
        ['Structural System', 'RCC framed structure as per approved structural drawings.'],
        ['Cement', 'OPC 53 grade cement.'],
        ['Flooring', 'Vitrified tiles flooring within agreed material allowance.'],
        ['Electrical', 'ISI-marked copper wiring with modular switches.'],
      ],
    ),
    mk(
      'Villa – Standard',
      'Premium villa construction BOQ with enhanced finishes.',
      'Villa',
      [
        'Preliminaries & Site Setup',
        'Earthwork & Excavation',
        'Foundation',
        'RCC / Structural Works',
        'Masonry',
        'Plastering',
        'Flooring & Tiling',
        'Doors & Windows',
        'Plumbing',
        'Electrical Works',
        'Painting',
      ],
      [
        ['Structural System', 'RCC framed structure designed for premium villa specification.'],
        ['Flooring', 'Premium vitrified / marble flooring within agreed allowance.'],
      ],
    ),
    mk(
      'Renovation',
      'Renovation project BOQ focused on finishing and repair works.',
      'Renovation',
      [
        'Preliminaries & Site Setup',
        'Demolition / Dismantling',
        'Plastering',
        'Flooring & Tiling',
        'Plumbing',
        'Electrical Works',
        'Painting',
      ],
      [
        ['Existing Condition', 'Quotation based on visible existing condition; concealed defects will be charged additionally.'],
      ],
    ),
  ];
}
