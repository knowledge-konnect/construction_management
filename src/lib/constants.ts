// Centralized application constants — simplified for MVP.

export const STORAGE_KEYS = {
  settings: 'sopan.settings',
  quotations: 'sopan.quotations',
  templates: 'sopan.templates',
  quotationSequence: 'sopan.quotationSequence',
  questionnaires: 'sopan.questionnaires',
  flatBillings: 'sopan.flatBillings',
  flatBillingSequence: 'sopan.flatBillingSequence',
} as const;

export const DEFAULT_BOQ_SECTIONS = [
  'Preliminaries & Site Setup',
  'Earthwork & Excavation',
  'Foundation',
  'PCC Works',
  'RCC / Structural Works',
  'Reinforcement Steel',
  'Masonry',
  'Plastering',
  'Flooring & Tiling',
  'Doors & Windows',
  'Plumbing',
  'Sanitary Works',
  'Electrical Works',
  'Painting',
  'Miscellaneous Works',
];

export const BOQ_UNITS = [
  'Sq.ft',
  'Sq.m',
  'Rft',
  'Nos',
  'kg',
  'Bag',
  'Litre',
  'LS / Lump Sum',
  'Job',
];

export const PROJECT_TYPES = [
  'Individual House',
  'Villa',
  'Apartment Building',
  'Commercial Building',
  'Renovation',
  'Extension / Additional Floor',
  'Interior Works',
  'Civil Works Only',
  'Other',
];

export const AREA_UNITS = ['Sq.ft', 'Sq.m', 'Sq.yd'];

export const FLOOR_OPTIONS = [
  'Ground Floor Only',
  'G+1',
  'G+2',
  'G+3',
  'G+4',
  'G+5',
  'Custom',
];

export const VALIDITY_OPTIONS = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days'];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
];

export const INCLUSION_SUGGESTIONS = [
  'Site setup',
  'Excavation',
  'Foundation work',
  'RCC structural work',
  'Masonry',
  'Plastering',
  'Flooring',
  'Plumbing',
  'Electrical',
  'Sanitary installation',
  'Painting',
  'Site cleaning',
  'Construction labour',
  'Construction materials',
];

export const EXCLUSION_SUGGESTIONS = [
  'Building approval charges',
  'Government fees',
  'Electricity connection charges',
  'Water connection charges',
  'Borewell',
  'Soil testing',
  'Lift / Elevator',
  'Compound wall',
  'Gate',
  'Landscaping',
  'Interior furniture',
  'Modular kitchen',
  'Air conditioning',
  'Registration / documentation charges',
  'Rock excavation',
];

export const PAYMENT_STAGE_SUGGESTIONS = [
  'Booking / Advance',
  'Foundation',
  'RCC Structure',
  'Masonry',
  'Plastering',
  'Flooring',
  'Electrical & Plumbing',
  'Painting',
  'Handover',
];

export const DISCOUNT_TYPES = ['None', 'Percentage', 'Fixed Amount'] as const;

// ─── Quotation status pipeline ────────────────────────────────────────────────

export const QUOTATION_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'GENERATED', label: 'Generated' },
  { value: 'SENT', label: 'Sent to Customer' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
] as const;

// ─── Questionnaire options ────────────────────────────────────────────────────

export const Q_STRUCTURE_TYPES = [
  'RCC Framed Structure',
  'Load-Bearing Structure',
  'Steel Structure',
  'Composite Structure',
];

export const Q_FOUNDATION_TYPES = [
  'Isolated Footing',
  'Raft Foundation',
  'Pile Foundation',
  'Strip Footing',
  'Combined Footing',
];

export const Q_CEMENT_BRANDS = [
  'UltraTech Cement',
  'ACC Cement',
  'Ambuja Cement',
  'Birla Cement',
  'Shree Cement',
  'Dalmia Cement',
  'Ramco Cement',
];

export const Q_STEEL_BRANDS = [
  'Tata Tiscon',
  'Tata Steel',
  'JSW Neosteel',
  'SAIL (Steel Authority of India)',
  'Jindal Panther',
  'Kamdhenu',
  'Vizag Steel',
];

export const Q_STEEL_GRADES = ['Fe 415', 'Fe 500', 'Fe 500D', 'Fe 550', 'Fe 600'];

export const Q_CONCRETE_MIXES = ['M20', 'M25', 'M30', 'M35', 'M40'];

export const Q_FLOORING_TYPES = [
  'Vitrified Tiles',
  'Marble',
  'Granite',
  'Ceramic Tiles',
  'Wooden Flooring',
  'Cement Flooring',
];

export const Q_FLOORING_BRANDS = [
  'Kajaria',
  'Somany',
  'Asian Granito',
  'Nitco',
  'Johnson Tiles',
  'Rak Ceramics',
];

export const Q_WALL_FINISHES = [
  'Cement Plaster',
  'POP (Plaster of Paris)',
  'Gypsum Plaster',
  'Texture Finish',
  'Wall Putty + Paint',
];

export const Q_PAINT_BRANDS = [
  'Asian Paints',
  'Berger Paints',
  'Nerolac Paints',
  'Dulux Paints',
  'Birla White',
];

export const Q_PAINT_TYPES = [
  'Emulsion',
  'Distemper',
  'Enamel',
  'Premium Emulsion',
  'Luster Paint',
];

export const Q_DOORS_TYPES = [
  'Teak Wood Door',
  'Flush Door',
  'PVC Door',
  'Membrane Door',
  'Engineered Door',
];

export const Q_WINDOWS_TYPES = [
  'Aluminium Sliding',
  'UPVC Sliding',
  'Casement Window',
  'Wooden Window',
  'French Window',
];

export const Q_WIRING_BRANDS = [
  'Havells',
  'Polycab',
  'Finolex',
  'Anchor',
  'V-Guard',
];

export const Q_SWITCHES_BRANDS = [
  'Anchor Roma',
  'Legrand',
  'Schneider Electric',
  'Havells',
  'GM Modular',
];

export const Q_PLUMBING_PIPES = [
  'Supreme Pipes',
  'Astral Pipes',
  'Prince Pipes',
  'Finolex Pipes',
  'Ashirvad Pipes',
];

export const Q_SANITARY_BRANDS = [
  'Jaquar',
  'Cera',
  'Kohler',
  'Hindware',
  'Parryware',
  'TOTO',
];
