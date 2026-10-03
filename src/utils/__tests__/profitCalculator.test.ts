/**
 * SECURITY TEST: Profit Calculator Verification
 *
 * This test verifies that profit calculation works correctly:
 * - Normal case with valid costs
 * - Sale price handling
 * - Missing cost data (should NOT show 100% profit)
 * - Explicit zero cost handling
 * - Zero selling price handling
 * - Loss (cost > selling price) handling
 */

import { describe, it, expect } from 'vitest';
import { calculateProductProfit } from '../profitCalculator';

describe('Profit Calculator', () => {
  it('should calculate normal case correctly', () => {
    const normalProduct = {
      price: 29.99,
      salePrice: undefined,
      supplierCost: {
        unitCost: 7,
        shippingCost: 3,
      },
    };

    const normalResult = calculateProductProfit(normalProduct as any);

    expect(normalResult).toBeDefined();
    expect(normalResult.effectiveSellingPrice).toBe(29.99);
    expect(normalResult.supplierLandedCost).toBe(10);
    expect(Math.abs(normalResult.estimatedGrossProfit! - 19.99)).toBeLessThan(0.01);
    expect(Math.abs(normalResult.estimatedGrossMarginPercentage! - 66.66)).toBeLessThan(0.01);
    expect(normalResult.hasCostData).toBe(true);
  });

  it('should use sale price when present', () => {
    const salePriceProduct = {
      price: 29.99,
      salePrice: 24.99,
      supplierCost: {
        unitCost: 7,
        shippingCost: 3,
      },
    };

    const salePriceResult = calculateProductProfit(salePriceProduct as any);

    expect(salePriceResult).toBeDefined();
    expect(salePriceResult.effectiveSellingPrice).toBe(24.99);
    expect(salePriceResult.supplierLandedCost).toBe(10);
    expect(Math.abs(salePriceResult.estimatedGrossProfit! - 14.99)).toBeLessThan(0.01);
    expect(Math.abs(salePriceResult.estimatedGrossMarginPercentage! - 59.98)).toBeLessThan(0.01);
    expect(salePriceResult.hasCostData).toBe(true);
  });

  it('should return null profit/margin for missing cost data', () => {
    const missingCostProduct = {
      price: 29.99,
      salePrice: undefined,
      supplierCost: undefined,
    };

    const missingCostResult = calculateProductProfit(missingCostProduct as any);

    expect(missingCostResult).toBeDefined();
    expect(missingCostResult.effectiveSellingPrice).toBe(29.99);
    expect(missingCostResult.supplierLandedCost).toBe(null);
    expect(missingCostResult.estimatedGrossProfit).toBe(null);
    expect(missingCostResult.estimatedGrossMarginPercentage).toBe(null);
    expect(missingCostResult.hasCostData).toBe(false);
  });

  it('should treat explicit zero cost as valid data', () => {
    const zeroCostProduct = {
      price: 29.99,
      salePrice: undefined,
      supplierCost: {
        unitCost: 0,
        shippingCost: 0,
      },
    };

    const zeroCostResult = calculateProductProfit(zeroCostProduct as any);

    expect(zeroCostResult).toBeDefined();
    expect(zeroCostResult.effectiveSellingPrice).toBe(29.99);
    expect(zeroCostResult.supplierLandedCost).toBe(0);
    expect(zeroCostResult.estimatedGrossProfit).toBe(29.99);
    expect(zeroCostResult.estimatedGrossMarginPercentage).toBe(100);
    expect(zeroCostResult.hasCostData).toBe(true);
  });

  it('should return null for zero selling price (no division by zero)', () => {
    const zeroPriceProduct = {
      price: 0,
      salePrice: undefined,
      supplierCost: {
        unitCost: 7,
        shippingCost: 3,
      },
    };

    const zeroPriceResult = calculateProductProfit(zeroPriceProduct as any);
    expect(zeroPriceResult).toBe(null);
  });

  it('should calculate loss case correctly (negative margin)', () => {
    const lossProduct = {
      price: 15,
      salePrice: undefined,
      supplierCost: {
        unitCost: 10,
        shippingCost: 10,
      },
    };

    const lossResult = calculateProductProfit(lossProduct as any);

    expect(lossResult).toBeDefined();
    expect(lossResult.effectiveSellingPrice).toBe(15);
    expect(lossResult.supplierLandedCost).toBe(20);
    expect(lossResult.estimatedGrossProfit).toBe(-5);
    expect(Math.abs(lossResult.estimatedGrossMarginPercentage! - (-33.33))).toBeLessThan(0.01);
    expect(lossResult.hasCostData).toBe(true);
  });

  it('should return null profit/margin for partial cost data (missing shippingCost)', () => {
    const partialCostProduct = {
      price: 29.99,
      salePrice: undefined,
      supplierCost: {
        unitCost: 7,
        shippingCost: undefined,
      },
    };

    const partialCostResult = calculateProductProfit(partialCostProduct as any);

    expect(partialCostResult).toBeDefined();
    expect(partialCostResult.effectiveSellingPrice).toBe(29.99);
    expect(partialCostResult.supplierLandedCost).toBe(null);
    expect(partialCostResult.estimatedGrossProfit).toBe(null);
    expect(partialCostResult.estimatedGrossMarginPercentage).toBe(null);
    expect(partialCostResult.hasCostData).toBe(false);
  });

  it('should return null profit/margin for partial cost data (missing unitCost)', () => {
    const partialCostProduct2 = {
      price: 29.99,
      salePrice: undefined,
      supplierCost: {
        unitCost: undefined,
        shippingCost: 3,
      },
    };

    const partialCostResult2 = calculateProductProfit(partialCostProduct2 as any);

    expect(partialCostResult2).toBeDefined();
    expect(partialCostResult2.effectiveSellingPrice).toBe(29.99);
    expect(partialCostResult2.supplierLandedCost).toBe(null);
    expect(partialCostResult2.estimatedGrossProfit).toBe(null);
    expect(partialCostResult2.estimatedGrossMarginPercentage).toBe(null);
    expect(partialCostResult2.hasCostData).toBe(false);
  });
});
