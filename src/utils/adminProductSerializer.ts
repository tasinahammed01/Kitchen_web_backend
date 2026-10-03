import { IProduct } from '../models/Product';
import { calculateProductProfit } from './profitCalculator';

/**
 * Admin-facing Product interface
 * Contains public information PLUS approved private supplier/cost/fulfillment fields
 * This is ONLY for authenticated admin users through /api/admin/* endpoints
 */
export interface AdminProduct {
  _id: string;
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  category: string;
  brand: string;
  stock: number;
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  colors: Array<{
    name: string;
    hex: string;
    image?: string;
  }>;
  sizes: Array<{
    name: string;
    available: boolean;
  }>;
  deliveryEstimate?: {
    minDays: number;
    maxDays: number;
  };

  // APPROVED PRIVATE FIELDS - Admin only
  supplierSource?: {
    platform: 'alibaba' | 'other';
    supplierName?: string;
    productUrl?: string;
    supplierProductId?: string;
    supplierVariantId?: string;
    sourceCountry?: string;
    moq?: number;
    notes?: string;
  };
  supplierCost?: {
    unitCost?: number;
    shippingCost?: number;
    currency?: string;
  };
  fulfillment?: {
    mode: 'manual_dropship' | 'manual_stock' | 'other';
    supplierLeadTimeMinDays?: number;
    supplierLeadTimeMaxDays?: number;
  };
  internalNotes?: string;

  // DERIVED PROFIT DATA (calculated server-side, only if cost data exists)
  profitData?: {
    effectiveSellingPrice: number;
    supplierLandedCost: number | null;
    estimatedGrossProfit: number | null;
    estimatedGrossMarginPercentage: number | null;
    hasCostData: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts an internal Product document to an admin Product object
 * Explicitly returns ONLY approved public + private fields (allowlist approach)
 *
 * SECURITY: This uses an explicit allowlist - only known fields are returned.
 * Unknown future fields will NOT leak automatically even to admins.
 *
 * This is the SINGLE SOURCE OF TRUTH for admin product serialization.
 * All admin API endpoints must use this function before returning product data.
 */
export function toAdminProduct(product: IProduct): AdminProduct {
  // Use toObject with transform: false to bypass the Mongoose transform that removes private fields
  const productObj = (product as any).toObject({ transform: false });

  // Calculate profit data if cost information is available
  const profitCalculation = calculateProductProfit(product);
  const profitData = profitCalculation ? {
    effectiveSellingPrice: profitCalculation.effectiveSellingPrice,
    supplierLandedCost: profitCalculation.supplierLandedCost,
    estimatedGrossProfit: profitCalculation.estimatedGrossProfit,
    estimatedGrossMarginPercentage: profitCalculation.estimatedGrossMarginPercentage,
    hasCostData: profitCalculation.hasCostData,
  } : undefined;

  // Explicitly return ONLY approved fields (allowlist approach)
  return {
    _id: productObj._id?.toString() || productObj.id || '',
    id: productObj._id?.toString() || productObj.id || '',
    slug: productObj.slug,
    name: productObj.name,
    description: productObj.description,
    shortDescription: productObj.shortDescription,
    price: productObj.price,
    salePrice: productObj.salePrice,
    rating: productObj.rating,
    reviewCount: productObj.reviewCount,
    images: productObj.images,
    category: productObj.category,
    brand: productObj.brand,
    stock: productObj.stock,
    tags: productObj.tags,
    featured: productObj.featured,
    newArrival: productObj.newArrival,
    bestSeller: productObj.bestSeller,
    colors: productObj.colors,
    sizes: productObj.sizes,
    deliveryEstimate: productObj.deliveryEstimate,

    // Approved private fields
    supplierSource: productObj.supplierSource,
    supplierCost: productObj.supplierCost,
    fulfillment: productObj.fulfillment,
    internalNotes: productObj.internalNotes,

    // Derived profit data (only if cost data exists)
    profitData,

    createdAt: productObj.createdAt,
    updatedAt: productObj.updatedAt,
  };
}

/**
 * Converts an array of internal Product documents to admin Product objects
 */
export function toAdminProducts(products: IProduct[]): AdminProduct[] {
  return products.map(toAdminProduct);
}

/**
 * Fields that are ALLOWED for admin product operations
 * Includes all public fields plus approved private supplier/cost/fulfillment fields
 */
export const ALLOWED_ADMIN_FIELDS = [
  // Public fields
  'slug',
  'name',
  'description',
  'shortDescription',
  'price',
  'salePrice',
  'rating',
  'reviewCount',
  'images',
  'category',
  'brand',
  'stock',
  'tags',
  'featured',
  'newArrival',
  'bestSeller',
  'colors',
  'sizes',
  'deliveryEstimate',

  // Approved private fields
  'supplierSource',
  'supplierCost',
  'fulfillment',
  'internalNotes',
] as const;

/**
 * Nested paths that are ALLOWED within supplierSource
 */
export const ALLOWED_SUPPLIER_SOURCE_FIELDS = [
  'platform',
  'supplierName',
  'productUrl',
  'supplierProductId',
  'supplierVariantId',
  'sourceCountry',
  'moq',
  'notes',
] as const;

/**
 * Nested paths that are ALLOWED within supplierCost
 */
export const ALLOWED_SUPPLIER_COST_FIELDS = [
  'unitCost',
  'shippingCost',
  'currency',
] as const;

/**
 * Nested paths that are ALLOWED within fulfillment
 */
export const ALLOWED_FULFILLMENT_FIELDS = [
  'mode',
  'supplierLeadTimeMinDays',
  'supplierLeadTimeMaxDays',
] as const;
