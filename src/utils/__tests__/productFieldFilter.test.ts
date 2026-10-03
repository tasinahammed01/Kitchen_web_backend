/**
 * SECURITY TEST: Mass-Assignment Protection Verification
 *
 * This test verifies that private supplier/cost/fulfillment fields
 * CANNOT be modified through the public product mutation API.
 */

import { describe, it, expect } from 'vitest';
import {
  filterPublicProductFields,
  containsForbiddenFields,
  FORBIDDEN_PRIVATE_FIELDS,
} from '../productFieldFilter';

describe('Mass-Assignment Protection', () => {
  it('should filter request body with nested private fields', () => {
    const maliciousRequestBody = {
      name: 'Test Product',
      price: 29.99,
      supplierSource: {
        platform: 'alibaba',
        supplierName: 'Hacker Supplier',
      },
      supplierCost: {
        unitCost: 1.00,
      },
      fulfillment: {
        mode: 'manual_dropship',
      },
      internalNotes: 'Malicious notes',
    };

    const filtered = filterPublicProductFields(maliciousRequestBody);

    for (const field of FORBIDDEN_PRIVATE_FIELDS) {
      expect(field in filtered).toBe(false);
    }
  });

  it('should preserve allowed public fields', () => {
    const maliciousRequestBody = {
      name: 'Test Product',
      price: 29.99,
      supplierCost: {
        unitCost: 1.00,
      },
    };

    const filtered = filterPublicProductFields(maliciousRequestBody);

    expect(filtered.name).toBe('Test Product');
    expect(filtered.price).toBe(29.99);
  });

  it('should detect forbidden fields', () => {
    const maliciousRequestBody = {
      name: 'Test Product',
      supplierCost: {
        unitCost: 1.00,
      },
    };

    const hasForbidden = containsForbiddenFields(maliciousRequestBody);
    expect(hasForbidden).toBe(true);
  });

  it('should reject MongoDB $set operator with dotted path', () => {
    const operatorPayload = {
      $set: {
        'supplierCost.unitCost': 1,
      },
    };

    const filteredOperator = filterPublicProductFields(operatorPayload);
    expect('$set' in filteredOperator).toBe(false);
  });

  it('should reject dotted path key (supplierCost.unitCost)', () => {
    const dottedPathPayload = {
      'supplierCost.unitCost': 1,
    };

    const filteredDotted = filterPublicProductFields(dottedPathPayload);
    expect('supplierCost.unitCost' in filteredDotted).toBe(false);
  });

  it('should reject MongoDB $unset operator', () => {
    const unsetPayload = {
      $unset: {
        supplierCost: 1,
      },
    };

    const filteredUnset = filterPublicProductFields(unsetPayload);
    expect('$unset' in filteredUnset).toBe(false);
  });

  it('should reject nested supplierCost object', () => {
    const nestedCostPayload = {
      supplierCost: {
        unitCost: 1,
      },
    };

    const filteredNested = filterPublicProductFields(nestedCostPayload);
    expect('supplierCost' in filteredNested).toBe(false);
  });

  it('should reject dotted path for supplierSource.productUrl', () => {
    const dottedUrlPayload = {
      'supplierSource.productUrl': 'https://attacker.example',
    };

    const filteredUrl = filterPublicProductFields(dottedUrlPayload);
    expect('supplierSource.productUrl' in filteredUrl).toBe(false);
  });

  it('should reject dotted path for fulfillment.mode', () => {
    const dottedFulfillmentPayload = {
      'fulfillment.mode': 'other',
    };

    const filteredFulfillment = filterPublicProductFields(dottedFulfillmentPayload);
    expect('fulfillment.mode' in filteredFulfillment).toBe(false);
  });

  it('should reject unknown arbitrary properties', () => {
    const unknownPayload = {
      name: 'Test Product',
      price: 29.99,
      unknownField: 'should be rejected',
      anotherUnknown: 123,
    };

    const filteredUnknown = filterPublicProductFields(unknownPayload);
    expect('unknownField' in filteredUnknown).toBe(false);
    expect('anotherUnknown' in filteredUnknown).toBe(false);
  });

  it('should preserve legitimate allowed fields', () => {
    const safeRequestBody = {
      name: 'Updated Product',
      price: 29.99,
      stock: 20,
      description: 'Updated description',
    };

    const safeFiltered = filterPublicProductFields(safeRequestBody);

    expect(safeFiltered.name).toBe('Updated Product');
    expect(safeFiltered.price).toBe(29.99);
    expect(safeFiltered.stock).toBe(20);
    expect(safeFiltered.description).toBe('Updated description');
  });

  it('should handle empty request body', () => {
    const emptyFiltered = filterPublicProductFields({});
    expect(Object.keys(emptyFiltered).length).toBe(0);
  });
});
