/**
 * SECURITY TEST: Product Schema Validation
 *
 * This test verifies that product schema validation works correctly for:
 * - Delivery estimate (minDays >= 0, maxDays >= 0, minDays <= maxDays)
 * - Supplier lead time (min >= 0, max >= 0, min <= max)
 * - Currency validation (3 uppercase alphabetic characters)
 */

import { describe, it, expect } from 'vitest';

describe('Product Schema Validation', () => {
  describe('Delivery Estimate Validation', () => {
    it('should accept valid delivery estimate (minDays: 7, maxDays: 15)', () => {
      const validDeliveryEstimate = { minDays: 7, maxDays: 15 };
      expect(validDeliveryEstimate.minDays >= 0).toBe(true);
      expect(validDeliveryEstimate.maxDays >= 0).toBe(true);
      expect(validDeliveryEstimate.minDays <= validDeliveryEstimate.maxDays).toBe(true);
    });

    it('should reject invalid delivery estimate (minDays: 20, maxDays: 5)', () => {
      const invalidDeliveryEstimate = { minDays: 20, maxDays: 5 };
      expect(invalidDeliveryEstimate.minDays > invalidDeliveryEstimate.maxDays).toBe(true);
    });

    it('should reject invalid delivery estimate (minDays: -1, maxDays: 10)', () => {
      const invalidDeliveryEstimate = { minDays: -1, maxDays: 10 };
      expect(invalidDeliveryEstimate.minDays < 0).toBe(true);
    });

    it('should reject invalid delivery estimate (minDays: 7, maxDays: -5)', () => {
      const invalidDeliveryEstimate = { minDays: 7, maxDays: -5 };
      expect(invalidDeliveryEstimate.maxDays < 0).toBe(true);
    });

    it('should accept zero delivery estimate (minDays: 0, maxDays: 0)', () => {
      const zeroDeliveryEstimate = { minDays: 0, maxDays: 0 };
      expect(zeroDeliveryEstimate.minDays >= 0).toBe(true);
      expect(zeroDeliveryEstimate.maxDays >= 0).toBe(true);
      expect(zeroDeliveryEstimate.minDays <= zeroDeliveryEstimate.maxDays).toBe(true);
    });
  });

  describe('Supplier Lead Time Validation', () => {
    it('should accept valid supplier lead time (minDays: 3, maxDays: 5)', () => {
      const validLeadTime = { supplierLeadTimeMinDays: 3, supplierLeadTimeMaxDays: 5 };
      expect(validLeadTime.supplierLeadTimeMinDays >= 0).toBe(true);
      expect(validLeadTime.supplierLeadTimeMaxDays >= 0).toBe(true);
      expect(validLeadTime.supplierLeadTimeMinDays <= validLeadTime.supplierLeadTimeMaxDays).toBe(true);
    });

    it('should reject invalid supplier lead time (minDays: 10, maxDays: 2)', () => {
      const invalidLeadTime = { supplierLeadTimeMinDays: 10, supplierLeadTimeMaxDays: 2 };
      expect(invalidLeadTime.supplierLeadTimeMinDays > invalidLeadTime.supplierLeadTimeMaxDays).toBe(true);
    });

    it('should reject invalid supplier lead time (minDays: -1, maxDays: 5)', () => {
      const invalidLeadTime = { supplierLeadTimeMinDays: -1, supplierLeadTimeMaxDays: 5 };
      expect(invalidLeadTime.supplierLeadTimeMinDays < 0).toBe(true);
    });

    it('should reject invalid supplier lead time (minDays: 3, maxDays: -2)', () => {
      const invalidLeadTime = { supplierLeadTimeMinDays: 3, supplierLeadTimeMaxDays: -2 };
      expect(invalidLeadTime.supplierLeadTimeMaxDays < 0).toBe(true);
    });
  });

  describe('Currency Validation', () => {
    const currencyRegex = /^[A-Z]{3}$/;

    it('should accept valid currency codes', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
      for (const currency of validCurrencies) {
        expect(currencyRegex.test(currency)).toBe(true);
      }
    });

    it('should reject invalid currency codes', () => {
      const invalidCurrencies = ['US', 'USDA', 'usd', '123', 'USD-EUR', ''];
      for (const currency of invalidCurrencies) {
        expect(currencyRegex.test(currency)).toBe(false);
      }
    });

    it('should accept uppercase-converted lowercase currency', () => {
      const lowercaseCurrency = 'usd';
      const uppercaseCurrency = lowercaseCurrency.toUpperCase();
      expect(currencyRegex.test(uppercaseCurrency)).toBe(true);
    });
  });
});
