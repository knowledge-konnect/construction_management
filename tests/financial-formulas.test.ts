import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateProjectedMargin } from '../server/src/businessModels.ts';
import {
    computeInvoiceFinancials,
    mergeInvoiceForValidation,
    resolveInvoiceDiscountInputs,
    validateInvoicePayload,
} from '../server/src/invoices.ts';
import {
    validateCustomerPayload,
    validateProjectPayload,
    validateSupplierPayload,
} from '../server/src/validation.ts';
import { calcCommercial } from '../src/lib/utils.ts';

function makeInvoiceItems() {
    return [
        {
            description: 'Item 1',
            quantity: 2,
            rate: 100,
            tax_percentage: 18,
            tax_treatment: 'taxable',
        },
        {
            description: 'Item 2',
            quantity: 1,
            rate: 50,
            tax_percentage: 0,
            tax_treatment: 'non_gst',
        },
    ];
}

test('invoice tax-inclusive totals remain internally consistent', () => {
    const { financials, lines } = computeInvoiceFinancials(
        [
            {
                description: 'Brickwork',
                quantity: 2,
                rate: 118,
                tax_percentage: 18,
                tax_treatment: 'taxable',
            },
            {
                description: 'Consultancy',
                quantity: 1,
                rate: 50,
                tax_percentage: 0,
                tax_treatment: 'non_gst',
            },
        ],
        {
            discountPercentage: 10,
            taxInclusive: true,
            supplyType: 'intra_state',
        },
    );

    const lineTaxable = Number(lines.reduce((sum, row) => sum + row.taxable_amount, 0).toFixed(2));
    const lineTax = Number(lines.reduce((sum, row) => sum + row.tax_amount, 0).toFixed(2));
    const lineTotal = Number(lines.reduce((sum, row) => sum + row.total_amount, 0).toFixed(2));

    assert.equal(financials.subtotal, lineTaxable);
    assert.equal(financials.tax_amount, lineTax);
    assert.equal(financials.grand_total, lineTotal);
    assert.equal(financials.cgst_amount + financials.sgst_amount + financials.igst_amount, financials.tax_amount);
});

test('invoice non-taxable treatments do not carry GST', () => {
    const { lines, financials } = computeInvoiceFinancials(
        [
            {
                description: 'GST exempt service',
                quantity: 1,
                rate: 1000,
                tax_percentage: 18,
                tax_treatment: 'exempt',
            },
        ],
        {
            taxInclusive: false,
            supplyType: 'inter_state',
        },
    );

    assert.equal(lines[0].tax_percentage, 0);
    assert.equal(lines[0].tax_amount, 0);
    assert.equal(financials.tax_amount, 0);
    assert.equal(financials.grand_total, financials.subtotal);
});

test('business-model projected margin follows model-specific formulas', () => {
    const contractMargin = calculateProjectedMargin({
        businessModel: 'contract_construction',
        contractAmount: 120000,
        budgetAmount: 90000,
    });
    assert.equal(contractMargin, 30000);

    const propertySelfMargin = calculateProjectedMargin({
        businessModel: 'property_development',
        developmentArrangement: 'self_development',
        projectedSalesValue: 250000,
        landCost: 100000,
        budgetAmount: 80000,
    });
    assert.equal(propertySelfMargin, 70000);

    const propertyJointMargin = calculateProjectedMargin({
        businessModel: 'property_development',
        developmentArrangement: 'joint_development',
        projectedSalesValue: 150000,
        budgetAmount: 90000,
    });
    assert.equal(propertyJointMargin, 60000);
});

test('commercial summary supports 100 percent discount boundary', () => {
    const quote = {
        boqSections: [
            {
                id: 'sec-1',
                title: 'Civil',
                displayOrder: 0,
                items: [
                    {
                        id: 'item-1',
                        description: 'Excavation',
                        quantity: 1,
                        unit: 'Nos',
                        rate: 1000,
                        amount: 1000,
                        displayOrder: 0,
                    },
                ],
            },
        ],
        additionalCharges: [],
        discount: { type: 'Percentage', value: 100 },
        tax: { applicable: true, rate: 18, name: 'GST' },
    } as any;

    const summary = calcCommercial(quote);

    assert.equal(summary.discountAmount, 1000);
    assert.equal(summary.taxableAmount, 0);
    assert.equal(summary.taxAmount, 0);
    assert.equal(summary.grandTotal, 0);
});

test('discount persistence inputs are preserved for create', () => {
    const resolved = resolveInvoiceDiscountInputs({
        payloadDiscountAmount: 1250,
        payloadDiscountPercentage: 5,
    });

    assert.equal(resolved.discountAmount, 1250);
    assert.equal(resolved.discountPercentage, 5);
});

test('draft update tax-mode change keeps existing discount inputs when not provided', () => {
    const resolved = resolveInvoiceDiscountInputs({
        existingDiscountAmount: 600,
        existingDiscountPercentage: 12,
        payloadDiscountAmount: undefined,
        payloadDiscountPercentage: undefined,
    });

    assert.equal(resolved.discountAmount, 600);
    assert.equal(resolved.discountPercentage, 12);
});

test('explicit discount update overrides only supplied discount fields', () => {
    const resolved = resolveInvoiceDiscountInputs({
        existingDiscountAmount: 500,
        existingDiscountPercentage: 8,
        payloadDiscountAmount: 300,
        payloadDiscountPercentage: undefined,
    });

    assert.equal(resolved.discountAmount, 300);
    assert.equal(resolved.discountPercentage, 8);
});

test('item-only partial update validates against merged state', () => {
    const existingInvoice = {
        customer_id: 'cust-1',
        invoice_date: '2026-11-05',
        items: makeInvoiceItems(),
        discount_amount: 100,
        discount_percentage: 0,
        supply_type: 'intra_state',
    };

    const patch = {
        items: [
            {
                description: 'Updated line',
                quantity: 1,
                rate: 200,
                tax_percentage: 18,
                tax_treatment: 'taxable',
            },
        ],
    };

    const merged = mergeInvoiceForValidation(existingInvoice as any, patch as any);
    const error = validateInvoicePayload(merged);
    assert.equal(error, null);
});

test('excessive fixed and percentage discounts are rejected for invoices', () => {
    const fixedError = validateInvoicePayload({
        customer_id: 'cust-1',
        items: makeInvoiceItems(),
        discount_amount: 300,
        discount_percentage: 0,
    });
    assert.equal(fixedError, 'Discount amount cannot exceed subtotal.');

    const percentageError = validateInvoicePayload({
        customer_id: 'cust-1',
        items: makeInvoiceItems(),
        discount_amount: 0,
        discount_percentage: 120,
    });
    assert.equal(percentageError, 'Discount percentage must be between 0 and 100.');
});

test('zero and hundred-percent discount boundaries behave correctly', () => {
    const zeroDiscount = computeInvoiceFinancials(makeInvoiceItems(), {
        discountAmount: 0,
        discountPercentage: 0,
        taxInclusive: false,
        supplyType: 'intra_state',
    });

    assert.equal(zeroDiscount.financials.discount_amount, 0);
    assert.ok(zeroDiscount.financials.subtotal > 0);

    const hundredPercent = computeInvoiceFinancials(makeInvoiceItems(), {
        discountAmount: 0,
        discountPercentage: 100,
        taxInclusive: false,
        supplyType: 'intra_state',
    });

    assert.equal(hundredPercent.financials.discount_amount, 250);
    assert.equal(hundredPercent.financials.subtotal, 0);
    assert.equal(hundredPercent.financials.tax_amount, 0);
    assert.equal(hundredPercent.financials.grand_total, 0);
});

test('quotation calculations reject excessive discount inputs', () => {
    const quote = {
        boqSections: [
            {
                id: 'sec-1',
                title: 'Civil',
                displayOrder: 0,
                items: [
                    {
                        id: 'item-1',
                        description: 'Excavation',
                        quantity: 1,
                        unit: 'Nos',
                        rate: 1000,
                        amount: 1000,
                        displayOrder: 0,
                    },
                ],
            },
        ],
        additionalCharges: [],
        discount: { type: 'Fixed Amount', value: 1500 },
        tax: { applicable: true, rate: 18, name: 'GST' },
    } as any;

    assert.throws(() => calcCommercial(quote), /Discount amount cannot exceed subtotal\./);
});

test('customer and supplier payloads require a mobile number', () => {
    assert.equal(validateCustomerPayload({ name: 'Acme Homes', mobile: '', email: 'hello@example.com', gstin: '27ABCDE1234F1Z5' }), 'Mobile number is required.');
    assert.equal(validateSupplierPayload({ name: 'Steel Works', mobile: '', gstin: '27ABCDE1234F1Z5' }), 'Mobile number is required.');
});

test('property development projects require an explicit development arrangement', () => {
    const error = validateProjectPayload({
        name: 'Skyline Phase 1',
        business_model: 'property_development',
    });

    assert.equal(error, 'Property development projects require an explicit development arrangement: self or joint_development.');
});
