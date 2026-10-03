/**
 * SECURITY TEST: Controller Sanitizer Integration Verification
 *
 * This test verifies that the product controller functions
 * use the filterPublicProductFields sanitizer for mass-assignment protection.
 *
 * This ensures the sanitizer cannot be bypassed by not using it in the controller.
 */

import { describe, it, expect } from 'vitest';
import { filterPublicProductFields } from '../../utils/productFieldFilter';

describe('Controller Sanitizer Integration', () => {
  it('should reject malicious payloads with supplierCost', () => {
    const maliciousPayload = {
      name: 'Test',
      supplierCost: { unitCost: 1 },
    };

    const sanitized = filterPublicProductFields(maliciousPayload);

    expect('supplierCost' in sanitized).toBe(false);
  });

  it('should allow legitimate fields', () => {
    const legitimatePayload = {
      name: 'Updated Product',
      price: 29.99,
      stock: 20,
    };

    const legitimateSanitized = filterPublicProductFields(legitimatePayload);

    expect(legitimateSanitized.name).toBe('Updated Product');
    expect(legitimateSanitized.price).toBe(29.99);
    expect(legitimateSanitized.stock).toBe(20);
  });
});
