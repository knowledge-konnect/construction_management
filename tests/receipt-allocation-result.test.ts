import assert from 'node:assert/strict';
import test from 'node:test';

import { mapReceiptAllocationResult } from '../server/src/receiptAllocationResult.ts';

test('maps camelCase RPC allocation fields and preserves compatibility values', () => {
    const mapped = mapReceiptAllocationResult({
        receiptRemaining: 200,
        invoiceOutstanding: 350,
        allocatedAmount: 75,
        receiptRemainingAfter: 125,
        invoiceOutstandingAfter: 275,
    });

    assert.deepEqual(mapped, {
        receiptRemaining: 200,
        invoiceOutstanding: 350,
        receiptRemainingAfter: 125,
        invoiceOutstandingAfter: 275,
        allocatedAmount: 75,
    });
});

test('maps snake_case RPC allocation fields and computes fallback after values', () => {
    const mapped = mapReceiptAllocationResult({
        receipt_remaining: '99.95',
        invoice_outstanding: '150.2',
        allocated_amount: '49.95',
    });

    assert.equal(mapped.receiptRemaining, 99.95);
    assert.equal(mapped.invoiceOutstanding, 150.2);
    assert.equal(mapped.allocatedAmount, 49.95);
    assert.equal(mapped.receiptRemainingAfter, 50);
    assert.equal(mapped.invoiceOutstandingAfter, 100.25);
});
