import { describe, expect, it } from 'vitest';

import { adjustStockSchema, createSparePartSchema } from './spare-part-schema';

describe('createSparePartSchema (FE-T23.5)', () => {
  it('accepts a valid spare part (US-23)', () => {
    const result = createSparePartSchema.safeParse({
      code: 'REP-ELC-004',
      name: 'Bujía NGK BPR6ES',
      category: 'ELECTRICO_LUCES',
      unitPrice: 45.5,
      initialStock: 20,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty code and a code longer than 50 characters', () => {
    expect(createSparePartSchema.shape.code.safeParse('').success).toBe(false);
    expect(createSparePartSchema.shape.code.safeParse('R'.repeat(51)).success).toBe(false);
    expect(createSparePartSchema.shape.code.safeParse('REP-ELC-004').success).toBe(true);
  });

  it('rejects a name longer than 150 characters', () => {
    expect(createSparePartSchema.shape.name.safeParse('N'.repeat(151)).success).toBe(false);
    expect(createSparePartSchema.shape.name.safeParse('Bujía NGK BPR6ES').success).toBe(true);
  });

  it('rejects a category outside the documented enum', () => {
    expect(createSparePartSchema.shape.category.safeParse('PIEZAS').success).toBe(false);
    expect(createSparePartSchema.shape.category.safeParse('MOTOR').success).toBe(true);
  });

  it('rejects a negative unit price and more than two decimals (BE-T23.6)', () => {
    expect(createSparePartSchema.shape.unitPrice.safeParse(-1).success).toBe(false);
    expect(createSparePartSchema.shape.unitPrice.safeParse(12.345).success).toBe(false);
    expect(createSparePartSchema.shape.unitPrice.safeParse(12.34).success).toBe(true);
  });

  it('rejects a negative or non-integer initial stock', () => {
    expect(createSparePartSchema.shape.initialStock.safeParse(-5).success).toBe(false);
    expect(createSparePartSchema.shape.initialStock.safeParse(2.5).success).toBe(false);
    expect(createSparePartSchema.shape.initialStock.safeParse(5).success).toBe(true);
  });
});

describe('adjustStockSchema (FE-T23.5)', () => {
  it('accepts a valid adjustment within the documented range', () => {
    const result = adjustStockSchema.safeParse({
      quantity: 4,
      reason: 'Conteo físico detectó unidades adicionales.',
    });
    expect(result.success).toBe(true);
  });

  it('requires a quantity between 1 and 99999', () => {
    expect(adjustStockSchema.shape.quantity.safeParse(0).success).toBe(false);
    expect(adjustStockSchema.shape.quantity.safeParse(100000).success).toBe(false);
    expect(adjustStockSchema.shape.quantity.safeParse(99999).success).toBe(true);
  });

  it('requires an integer quantity (no decimals)', () => {
    expect(adjustStockSchema.shape.quantity.safeParse(1.5).success).toBe(false);
  });

  it('requires the reason to have between 10 and 500 characters (trimmed)', () => {
    expect(adjustStockSchema.shape.reason.safeParse('  corto  ').success).toBe(false);
    expect(adjustStockSchema.shape.reason.safeParse('R'.repeat(501)).success).toBe(false);
    expect(
      adjustStockSchema.shape.reason.safeParse(
        '  Razón válida con longitud suficiente para registrar el ajuste.  ',
      ).success,
    ).toBe(true);
  });
});