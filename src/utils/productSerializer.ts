import { IProduct } from '../models/Product';

/**
 * Public-facing Product interface
 * Contains only customer-safe information
 * Private supplier/cost/fulfillment fields are excluded
 */
export interface PublicProduct {
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts an internal Product document to a public-facing Product object
 * Explicitly returns ONLY approved public fields (allowlist approach)
 *
 * This is the SINGLE SOURCE OF TRUTH for public product serialization
 * All public API endpoints must use this function before returning product data
 *
 * SECURITY: This uses an explicit allowlist - only known public fields are returned.
 * Unknown future fields will NOT leak automatically.
 */
export function toPublicProduct(product: IProduct): PublicProduct {
  const productObj = (product as any).toObject();

  // Explicitly return ONLY approved public fields (allowlist approach)
  // This prevents unknown future private fields from leaking
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
    createdAt: productObj.createdAt,
    updatedAt: productObj.updatedAt,
  };
}

/**
 * Converts an array of internal Product documents to public Product objects
 */
export function toPublicProducts(products: IProduct[]): PublicProduct[] {
  return products.map(toPublicProduct);
}

/**
 * Fields that are PRIVATE and must never appear in public API responses
 */
export const PRIVATE_FIELDS = [
  'supplierSource',
  'supplierCost',
  'fulfillment',
  'internalNotes',
] as const;

/**
 * Fields that are PUBLIC and safe to return to customers
 */
export const PUBLIC_FIELDS = [
  '_id',
  'id',
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
  'createdAt',
  'updatedAt',
] as const;
