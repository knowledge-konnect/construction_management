BEGIN;

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  supplier_party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE RESTRICT,
  po_number text NOT NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'cancelled', 'closed')),
  subtotal numeric(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, po_number)
);

CREATE TABLE public.purchase_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text,
  rate numeric(18,2) NOT NULL DEFAULT 0 CHECK (rate >= 0),
  line_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (line_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_orders_company_project
  ON public.purchase_orders (company_id, project_id, created_at DESC);

CREATE INDEX idx_purchase_orders_supplier
  ON public.purchase_orders (supplier_party_id, status);

CREATE INDEX idx_purchase_order_lines_order
  ON public.purchase_order_lines (purchase_order_id, created_at);

CREATE TRIGGER set_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_purchase_order_lines_updated_at
BEFORE UPDATE ON public.purchase_order_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMIT;
