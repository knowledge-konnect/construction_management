type AllocationResultLike = Record<string, unknown>;

function parseNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') return fallback;
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function roundCurrency(value: number): number {
    return Number(Math.round((value + Number.EPSILON) * 100) / 100);
}

function pickNumeric(result: AllocationResultLike, keys: string[], fallback = 0): number {
    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(result, key)) continue;
        const value = parseNumber(result[key], Number.NaN);
        if (Number.isFinite(value)) return value;
    }
    return fallback;
}

export function mapReceiptAllocationResult(result: AllocationResultLike) {
    const receiptRemaining = roundCurrency(pickNumeric(result, ['receiptRemaining', 'receipt_remaining'], 0));
    const invoiceOutstanding = roundCurrency(pickNumeric(result, ['invoiceOutstanding', 'invoice_outstanding'], 0));
    const allocatedAmount = roundCurrency(pickNumeric(result, ['allocatedAmount', 'allocated_amount'], 0));

    const receiptRemainingAfter = roundCurrency(
        pickNumeric(
            result,
            ['receiptRemainingAfter', 'receipt_remaining_after'],
            Math.max(0, receiptRemaining - allocatedAmount),
        ),
    );

    const invoiceOutstandingAfter = roundCurrency(
        pickNumeric(
            result,
            ['invoiceOutstandingAfter', 'invoice_outstanding_after'],
            Math.max(0, invoiceOutstanding - allocatedAmount),
        ),
    );

    return {
        receiptRemaining,
        invoiceOutstanding,
        receiptRemainingAfter,
        invoiceOutstandingAfter,
        allocatedAmount,
    };
}
