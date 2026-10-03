/**
 * Mass-assignment protection for Product mutations
 *
 * IMPORTANT: Until authentication/admin authorization is implemented,
 * the public product mutation endpoints (POST /api/products, PUT /api/products/:id)
 * remain unprotected.
 *
 * This utility ensures that even through the unprotected public API,
 * private supplier/cost/fulfillment fields CANNOT be modified by unauthenticated users.
 *
 * Authorized supplier editing will be introduced only after admin security exists.
 */

/**
 * Fields that are ALLOWED for public product mutations
 * These are the existing safe/public Product fields
 */
export const ALLOWED_PUBLIC_FIELDS = [
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
] as const;

/**
 * Fields that are FORBIDDEN for public product mutations
 * These contain private supplier/cost/fulfillment information
 */
export const FORBIDDEN_PRIVATE_FIELDS = [
  'supplierSource',
  'supplierCost',
  'fulfillment',
  'internalNotes',
] as const;

/**
 * Filters request body to only include allowed public fields
 * Removes any private supplier/cost/fulfillment fields
 *
 * SECURITY: This prevents mass-assignment attacks by:
 * 1. Only accepting explicit allowlisted field names
 * 2. Rejecting MongoDB operators ($set, $unset, etc.)
 * 3. Rejecting dotted path keys (e.g., "supplierCost.unitCost")
 * 4. Rejecting unknown properties
 *
 * This approach is safe even before authentication is implemented
 */
export function filterPublicProductFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};

  for (const key of ALLOWED_PUBLIC_FIELDS) {
    // Only include if:
    // 1. Key exists in body
    // 2. Key is not a MongoDB operator (starts with $)
    // 3. Key is not a dotted path (contains .)
    if (key in body && !key.startsWith('$') && !key.includes('.')) {
      filtered[key] = body[key];
    }
  }

  return filtered;
}

/**
 * Checks if the request body contains any forbidden private fields
 * Returns true if forbidden fields are present
 */
export function containsForbiddenFields(body: Record<string, unknown>): boolean {
  return FORBIDDEN_PRIVATE_FIELDS.some(field => field in body);
}
