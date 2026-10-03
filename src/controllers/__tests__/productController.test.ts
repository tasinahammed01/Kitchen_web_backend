/**
 * PUBLIC PRODUCT CONTROLLER TESTS - Phase 4
 *
 * Public product routes are READ-ONLY.
 * All mutation operations (create, update, delete) are handled through the admin API.
 *
 * This test verifies that the public controller only exports read operations.
 *
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import * as productController from '../../controllers/productController';

describe('Public Product Controller Read-Only Verification', () => {
  it('should export getAllProducts', () => {
    expect(productController.getAllProducts).toBeDefined();
  });

  it('should export getProductBySlug', () => {
    expect(productController.getProductBySlug).toBeDefined();
  });

  it('should export getProductsByCategory', () => {
    expect(productController.getProductsByCategory).toBeDefined();
  });

  it('should export getFeaturedProducts', () => {
    expect(productController.getFeaturedProducts).toBeDefined();
  });

  it('should export getNewArrivals', () => {
    expect(productController.getNewArrivals).toBeDefined();
  });

  it('should export getBestSellers', () => {
    expect(productController.getBestSellers).toBeDefined();
  });

  it('should NOT export createProduct', () => {
    expect((productController as any).createProduct).toBeUndefined();
  });

  it('should NOT export updateProduct', () => {
    expect((productController as any).updateProduct).toBeUndefined();
  });

  it('should NOT export deleteProduct', () => {
    expect((productController as any).deleteProduct).toBeUndefined();
  });
});
