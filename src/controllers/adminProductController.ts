import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { toAdminProduct, toAdminProducts } from '../utils/adminProductSerializer';
import { filterAdminProductFields, getUnknownFields, containsDangerousKeys } from '../utils/adminProductFieldFilter';

// Get all products (admin)
// Returns approved private supplier/cost/fulfillment fields
export const getAllAdminProducts = async (req: Request, res: Response) => {
  try {
    // Admin endpoint: retrieve all fields including private supplier data
    const products = await Product.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: toAdminProducts(products),
    });
  } catch (error) {
    console.error('[Admin] Error fetching products:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch products.',
    });
  }
};

// Get single product by ID (admin)
// Returns approved private supplier/cost/fulfillment fields
export const getAdminProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Admin endpoint: retrieve all fields including private supplier data
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: toAdminProduct(product),
    });
  } catch (error) {
    console.error('[Admin] Error fetching product:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch product.',
    });
  }
};

// Create product (admin)
// Admin may create public fields and approved private dropshipping fields
export const createAdminProduct = async (req: Request, res: Response) => {
  try {
    // SECURITY: Check for dangerous keys before processing
    if (containsDangerousKeys(req.body)) {
      console.warn(`[Admin] Rejected product creation with dangerous keys by user ${req.user?.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid request: contains dangerous keys.',
      });
    }

    // SECURITY: Use explicit allowlist to prevent mass-assignment attacks
    const sanitized = filterAdminProductFields(req.body);

    // Check for unknown fields and log warning
    const unknownFields = getUnknownFields(req.body);
    if (unknownFields.length > 0) {
      console.warn(`[Admin] Attempted to create product with unknown fields: ${unknownFields.join(', ')}`);
    }

    // Log security event
    console.log(`[Admin] Product creation attempted by user ${req.user?.id} (${req.user?.email})`);

    const product = await Product.create(sanitized);

    // Log success
    console.log(`[Admin] Product created successfully: ${product._id} by user ${req.user?.id}`);

    res.status(201).json({
      success: true,
      data: toAdminProduct(product),
    });
  } catch (error) {
    console.error(`[Admin] Product creation failed by user ${req.user?.id}: ${(error as Error).message}`);
    res.status(400).json({
      success: false,
      message: 'Unable to create product.',
    });
  }
};

// Update product (admin)
// Admin may update approved public and private fields
// Uses PATCH semantics with explicit safe merge for nested objects
export const updateAdminProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // SECURITY: Check for dangerous keys before processing
    if (containsDangerousKeys(req.body)) {
      console.warn(`[Admin] Rejected product update with dangerous keys by user ${req.user?.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid request: contains dangerous keys.',
      });
    }

    // SECURITY: Use explicit allowlist to prevent mass-assignment attacks
    const sanitized = filterAdminProductFields(req.body);

    // Check for unknown fields and log warning
    const unknownFields = getUnknownFields(req.body);
    if (unknownFields.length > 0) {
      console.warn(`[Admin] Attempted to update product ${id} with unknown fields: ${unknownFields.join(', ')}`);
    }

    // Log security event
    console.log(`[Admin] Product update attempted for ${id} by user ${req.user?.id} (${req.user?.email})`);

    // Use findById + save for full Mongoose document validation
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Apply sanitized allowed values with explicit merge semantics for nested objects
    // For nested objects (supplierSource, supplierCost, fulfillment), preserve existing omitted values
    for (const [key, value] of Object.entries(sanitized)) {
      if (key === 'supplierSource' && typeof value === 'object' && value !== null) {
        // Explicit merge: preserve existing supplierSource fields not in the update
        product.supplierSource = {
          ...(product.supplierSource || {}),
          ...(value as Record<string, unknown>),
        } as any;
      } else if (key === 'supplierCost' && typeof value === 'object' && value !== null) {
        // Explicit merge: preserve existing supplierCost fields not in the update
        product.supplierCost = {
          ...(product.supplierCost || {}),
          ...(value as Record<string, unknown>),
        } as any;
      } else if (key === 'fulfillment' && typeof value === 'object' && value !== null) {
        // Explicit merge: preserve existing fulfillment fields not in the update
        product.fulfillment = {
          ...(product.fulfillment || {}),
          ...(value as Record<string, unknown>),
        } as any;
      } else if (key === 'deliveryEstimate' && typeof value === 'object' && value !== null) {
        // Explicit merge: preserve existing deliveryEstimate fields not in the update
        product.deliveryEstimate = {
          ...(product.deliveryEstimate || {}),
          ...(value as Record<string, unknown>),
        } as any;
      } else {
        // For non-nested fields, direct assignment
        (product as any)[key] = value;
      }
    }

    // Save to trigger full validation including cross-field validators
    await product.save();

    // Log success
    console.log(`[Admin] Product updated successfully: ${id} by user ${req.user?.id}`);

    res.json({
      success: true,
      data: toAdminProduct(product),
    });
  } catch (error) {
    console.error(`[Admin] Product update failed for ${id} by user ${req.user?.id}: ${(error as Error).message}`);
    res.status(400).json({
      success: false,
      message: 'Unable to update product.',
    });
  }
};

// Delete product (admin)
export const deleteAdminProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Log security event
    console.log(`[Admin] Product deletion attempted for ${id} by user ${req.user?.id} (${req.user?.email})`);

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Log success
    console.log(`[Admin] Product deleted successfully: ${id} by user ${req.user?.id}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error(`[Admin] Product deletion failed for ${id} by user ${req.user?.id}: ${(error as Error).message}`);
    res.status(400).json({
      success: false,
      message: 'Unable to delete product.',
    });
  }
};
