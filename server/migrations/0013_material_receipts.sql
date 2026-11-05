BEGIN;

CREATE TABLE public.material_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
  supplier_party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE RESTRICT,
  receipt_number text NOT NULL,
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_reference_number text,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, receipt_number)
);

CREATE TABLE public.material_receipt_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_receipt_id uuid NOT NULL REFERENCES public.material_receipts(id) ON DELETE CASCADE,
  purchase_order_line_id uuid NOT NULL REFERENCES public.purchase_order_lines(id) ON DELETE RESTRICT,
  ordered_quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (ordered_quantity >= 0),
  previously_received_quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (previously_received_quantity >= 0),
  quantity_received numeric(18,4) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  accepted_quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  rejected_quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
  remaining_quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (remaining_quantity >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_material_receipts_project_po
  ON public.material_receipts (company_id, project_id, purchase_order_id, receipt_date DESC);

CREATE INDEX idx_material_receipts_supplier
  ON public.material_receipts (supplier_party_id, status);

CREATE INDEX idx_material_receipt_lines_receipt
  ON public.material_receipt_lines (material_receipt_id, purchase_order_line_id);

CREATE INDEX idx_material_receipt_lines_po_line
  ON public.material_receipt_lines (purchase_order_line_id, created_at DESC);

CREATE TRIGGER set_material_receipts_updated_at
BEFORE UPDATE ON public.material_receipts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_material_receipt_lines_updated_at
BEFORE UPDATE ON public.material_receipt_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMIT;
