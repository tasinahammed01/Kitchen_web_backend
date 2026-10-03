import {
  ALLOWED_ADMIN_FIELDS,
  ALLOWED_SUPPLIER_SOURCE_FIELDS,
  ALLOWED_SUPPLIER_COST_FIELDS,
  ALLOWED_FULFILLMENT_FIELDS,
} from './adminProductSerializer';

/**
 * Mass-assignment protection for Admin Product mutations
 *
 * This utility ensures that even admin users can only modify
 * explicitly allowed fields through the admin API.
 *
 * SECURITY: This prevents mass-assignment attacks by:
 * 1. Only accepting explicit allowlisted field names
 * 2. Rejecting MongoDB operators ($set, $unset, etc.)
 * 3. Rejecting dotted path keys (e.g., "supplierCost.unitCost")
 * 4. Rejecting prototype pollution keys (__proto__, constructor, prototype)
 * 5. Rejecting unknown properties
 * 6. Validating nested object structures for supplier fields
 */

/**
 * Dangerous keys that must never be allowed
 */
const DANGEROUS_KEYS = [
  '__proto__',
  'constructor',
  'prototype',
  'prototype.polluted',
  'constructor.prototype',
  '$set',
  '$unset',
  '$inc',
  '$mul',
  '$rename',
  '$min',
  '$max',
  '$push',
  '$pull',
  '$pop',
  '$addToSet',
  '$each',
  '$position',
  '$slice',
  '$sort',
] as const;

/**
 * Checks if a key is dangerous (MongoDB operator or prototype pollution key)
 */
function isDangerousKey(key: string): boolean {
  // Check for MongoDB operators (starts with $)
  if (key.startsWith('$')) {
    return true;
  }

  // Check for dotted paths (contains .)
  if (key.includes('.')) {
    return true;
  }

  // Check for prototype pollution keys
  if (DANGEROUS_KEYS.includes(key as any)) {
    return true;
  }

  return false;
}

/**
 * Fields that can be explicitly cleared using null
 * These are optional fields where null means "remove this value"
 *
 * Note: Required fields like 'mode' are NOT in this list
 */
const CLEARABLE_FIELDS = [
  'supplierVariantId',
  'sourceCountry',
  'moq',
  'notes',
  'unitCost',
  'shippingCost',
  'supplierLeadTimeMinDays',
  'supplierLeadTimeMaxDays',
] as const;

/**
 * Checks if a field is clearable (can be set to null to remove)
 */
function isClearableField(field: string): boolean {
  return CLEARABLE_FIELDS.includes(field as any);
}

/**
 * Filters a nested object to only include allowed keys
 * Used for supplierSource, supplierCost, fulfillment nested objects
 * Returns undefined if no allowed keys are present (to avoid creating empty objects)
 *
 * Supports clearing semantics: null values for clearable fields are preserved
 */
function filterNestedObject(
  obj: Record<string, unknown>,
  allowedKeys: readonly string[]
): Record<string, unknown> | undefined {
  const filtered: Record<string, unknown> = {};

  for (const key of allowedKeys) {
    if (key in obj && !isDangerousKey(key)) {
      const value = obj[key];

      // Preserve null for clearable fields (clearing semantics)
      if (value === null && isClearableField(key)) {
        filtered[key] = null;
      } else if (value !== null) {
        // Only include non-null values for non-clearable fields
        filtered[key] = value;
      }
    }
  }

  // Return undefined if no fields were filtered (avoid creating empty objects)
  return Object.keys(filtered).length > 0 ? filtered : undefined;
}

/**
 * Filters request body to only include allowed admin fields
 * Applies safe merge semantics for nested objects (MERGE, not REPLACE)
 *
 * SECURITY: This prevents mass-assignment attacks while allowing
 * legitimate admin updates to supplier/cost/fulfillment data.
 */
export function filterAdminProductFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};

  for (const key of ALLOWED_ADMIN_FIELDS) {
    // Only include if:
    // 1. Key exists in body
    // 2. Key is not dangerous (operator, dotted path, prototype key)
    if (key in body && !isDangerousKey(key)) {
      const value = body[key];

      // Special handling for nested objects - apply safe merge
      if (key === 'supplierSource' && typeof value === 'object' && value !== null) {
        const filteredNested = filterNestedObject(value as Record<string, unknown>, ALLOWED_SUPPLIER_SOURCE_FIELDS);
        if (filteredNested) {
          filtered[key] = filteredNested;
        }
      } else if (key === 'supplierCost' && typeof value === 'object' && value !== null) {
        const filteredNested = filterNestedObject(value as Record<string, unknown>, ALLOWED_SUPPLIER_COST_FIELDS);
        if (filteredNested) {
          filtered[key] = filteredNested;
        }
      } else if (key === 'fulfillment' && typeof value === 'object' && value !== null) {
        const filteredNested = filterNestedObject(value as Record<string, unknown>, ALLOWED_FULFILLMENT_FIELDS);
        if (filteredNested) {
          filtered[key] = filteredNested;
        }
      } else {
        // For non-nested fields, just copy the value
        filtered[key] = value;
      }
    }
  }

  return filtered;
}

/**
 * Checks if the request body contains any dangerous keys
 * Returns true if dangerous keys are present
 *
 * Recursively checks:
 * - Top-level keys for operators ($), dotted paths, prototype pollution
 * - Nested objects within allowed structures
 * - Array elements (colors[], sizes[], etc.)
 *
 * NOTE: Uses Object.getOwnPropertyNames() to catch prototype pollution keys like __proto__
 */
export function containsDangerousKeys(body: Record<string, unknown>): boolean {
  // Use getOwnPropertyNames to catch prototype pollution keys
  const keys = Object.getOwnPropertyNames(body);

  for (const key of keys) {
    if (isDangerousKey(key)) {
      return true;
    }

    // Recursively check nested objects
    const value = body[key];
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Check each array element
        for (const item of value) {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            if (containsDangerousKeys(item as Record<string, unknown>)) {
              return true;
            }
          }
        }
      } else {
        // Check nested object
        if (containsDangerousKeys(value as Record<string, unknown>)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks if the request body contains unknown fields (not in allowlist)
 * Returns list of unknown field names
 */
export function getUnknownFields(body: Record<string, unknown>): string[] {
  const unknownFields: string[] = [];

  for (const key of Object.keys(body)) {
    if (!ALLOWED_ADMIN_FIELDS.includes(key as any)) {
      unknownFields.push(key);
    }
  }

  return unknownFields;
}
