/**
 * SECURITY TEST: Private Field Leakage Verification
 *
 * This test verifies that private supplier/cost/fulfillment information
 * is NEVER exposed through the public product serializer.
 */

import { describe, it, expect } from 'vitest';
import { toPublicProduct, toPublicProducts, PRIVATE_FIELDS } from '../productSerializer';

const mockProductWithPrivateData = {
  _id: '507f1f77bcf86cd799439011',
  slug: 'test-product',
  name: 'Test Product',
  description: 'Test description',
  shortDescription: 'Test short description',
  price: 29.99,
  salePrice: 24.99,
  rating: 4.5,
  reviewCount: 100,
  images: ['https://example.com/image.jpg'],
  category: 'Kitchen Tools',
  brand: 'TestBrand',
  stock: 50,
  tags: ['test'],
  featured: true,
  newArrival: false,
  bestSeller: false,
  colors: [{ name: 'Red', hex: '#FF0000' }],
  sizes: [{ name: 'Large', available: true }],
  deliveryEstimate: { minDays: 7, maxDays: 15 },
  supplierSource: {
    platform: 'alibaba' as const,
    supplierName: 'Private Supplier',
    productUrl: 'https://alibaba.com/private-product',
    supplierProductId: '123456',
    supplierVariantId: '789',
    sourceCountry: 'China',
    moq: 100,
    notes: 'Internal notes',
  },
  supplierCost: {
    unitCost: 7.00,
    shippingCost: 3.00,
    currency: 'USD',
  },
  fulfillment: {
    mode: 'manual_dropship' as const,
    supplierLeadTimeMinDays: 3,
    supplierLeadTimeMaxDays: 5,
  },
  internalNotes: 'This is confidential internal information',
  futurePrivateSupplierField: 'MUST_NOT_LEAK',
  createdAt: new Date(),
  updatedAt: new Date(),
  toObject: function() {
    return { ...this };
  },
};

describe('Private Field Leakage Protection', () => {
  it('should remove all private fields from single product', () => {
    const publicProduct = toPublicProduct(mockProductWithPrivateData as any);

    for (const field of PRIVATE_FIELDS) {
      expect(field in publicProduct).toBe(false);
    }
  });

  it('should remove all private fields from product array', () => {
    const publicProducts = toPublicProducts([mockProductWithPrivateData as any]);

    for (const product of publicProducts) {
      for (const field of PRIVATE_FIELDS) {
        expect(field in product).toBe(false);
      }
    }
  });

  it('should preserve required public fields', () => {
    const publicProduct = toPublicProduct(mockProductWithPrivateData as any);
    const requiredPublicFields = ['id', 'slug', 'name', 'price', 'deliveryEstimate'];

    for (const field of requiredPublicFields) {
      expect(field in publicProduct).toBe(true);
    }
  });

  it('should expose delivery estimate publicly', () => {
    const publicProduct = toPublicProduct(mockProductWithPrivateData as any);
    expect(publicProduct.deliveryEstimate).toBeDefined();
    expect(publicProduct.deliveryEstimate.minDays).toBe(7);
    expect(publicProduct.deliveryEstimate.maxDays).toBe(15);
  });

  it('should block future private field (allowlist working)', () => {
    const publicProduct = toPublicProduct(mockProductWithPrivateData as any);
    expect('futurePrivateSupplierField' in publicProduct).toBe(false);
  });

  it('should ensure specific private fields are absent', () => {
    const publicProduct = toPublicProduct(mockProductWithPrivateData as any);
    const specificPrivateFields = ['supplierSource', 'supplierCost', 'fulfillment', 'internalNotes'];

    for (const field of specificPrivateFields) {
      expect(field in publicProduct).toBe(false);
    }
  });

  it('should enforce allowlist (no unknown fields leak)', () => {
    const publicProduct = toPublicProduct(mockProductWithPrivateData as any);
    const publicKeys = Object.keys(publicProduct);
    const knownPublicFields = [
      '_id', 'id', 'slug', 'name', 'description', 'shortDescription',
      'price', 'salePrice', 'rating', 'reviewCount', 'images',
      'category', 'brand', 'stock', 'tags', 'featured', 'newArrival',
      'bestSeller', 'colors', 'sizes', 'deliveryEstimate', 'createdAt', 'updatedAt'
    ];

    const unknownFields = publicKeys.filter(key => !knownPublicFields.includes(key));
    expect(unknownFields.length).toBe(0);
  });
});
