CREATE OR REPLACE FUNCTION public.apply_receipt_allocation(
  p_company_id uuid,
  p_receipt_id uuid,
  p_invoice_id uuid,
  p_requested_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_receipt record;
  v_invoice record;
  v_receipt_total_allocated numeric;
  v_invoice_total_allocated numeric;
  v_receipt_remaining numeric;
  v_invoice_outstanding numeric;
  v_allocated_amount numeric;
  v_allocation record;
BEGIN
  SELECT *
  INTO v_receipt
  FROM public.project_receipts
  WHERE id = p_receipt_id AND company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt not found.';
  END IF;

  SELECT *
  INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id AND company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found.';
  END IF;

  IF v_invoice.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cancelled invoices cannot receive payment allocations.';
  END IF;

  IF v_invoice.status <> 'Issued' THEN
    RAISE EXCEPTION 'Only issued invoices can receive payment allocations.';
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_receipt_total_allocated
  FROM public.payment_allocations
  WHERE receipt_id = p_receipt_id;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_invoice_total_allocated
  FROM public.payment_allocations
  WHERE invoice_id = p_invoice_id;

  v_receipt_remaining := GREATEST(v_receipt.amount - v_receipt_total_allocated, 0::numeric);
  v_invoice_outstanding := GREATEST(v_invoice.grand_total - v_invoice_total_allocated, 0::numeric);

  IF p_requested_amount IS NULL OR p_requested_amount <= 0 THEN
    RAISE EXCEPTION 'Allocation amount must be greater than zero.';
  END IF;

  IF v_receipt_remaining <= 0 THEN
    RAISE EXCEPTION 'This receipt has no remaining balance to allocate.';
  END IF;

  IF v_invoice_outstanding <= 0 THEN
    RAISE EXCEPTION 'This invoice is already fully paid.';
  END IF;

  v_allocated_amount := LEAST(p_requested_amount, v_receipt_remaining, v_invoice_outstanding);

  IF v_allocated_amount <= 0 THEN
    RAISE EXCEPTION 'Requested amount exceeds the remaining receipt balance or invoice outstanding amount.';
  END IF;

  INSERT INTO public.payment_allocations (company_id, invoice_id, receipt_id, allocated_amount)
  VALUES (p_company_id, p_invoice_id, p_receipt_id, v_allocated_amount)
  RETURNING * INTO v_allocation;

  RETURN jsonb_build_object(
    'allocation', jsonb_build_object(
      'id', v_allocation.id,
      'companyId', v_allocation.company_id,
      'invoiceId', v_allocation.invoice_id,
      'receiptId', v_allocation.receipt_id,
      'allocatedAmount', v_allocation.allocated_amount,
      'createdAt', v_allocation.created_at
    ),
    'receiptRemaining', v_receipt_remaining,
    'invoiceOutstanding', v_invoice_outstanding,
    'allocatedAmount', v_allocated_amount
  );
END;
$$;
