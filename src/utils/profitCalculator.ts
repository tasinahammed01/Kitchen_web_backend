import { IProduct } from '../models/Product';

/**
 * Result of gross profit calculation
 * This is an ESTIMATED PRODUCT GROSS MARGIN only
 * Does NOT include: PayPal fees, taxes, advertising, refunds, chargebacks,
 * currency conversion, operating expenses, or other business costs
 */
export interface ProfitCalculation {
  effectiveSellingPrice: number;
  supplierLandedCost: number | null;
  estimatedGrossProfit: number | null;
  estimatedGrossMarginPercentage: number | null;
  hasCostData: boolean;
}

/**
 * Calculates estimated gross product profit and margin
 *
 * Formula:
 * effectiveSellingPrice = salePrice if valid and present, otherwise price
 * supplierLandedCost = supplier unit cost + supplier shipping cost
 * estimatedGrossProfit = effectiveSellingPrice - supplierLandedCost
 * estimatedGrossMarginPercentage = (estimatedGrossProfit / effectiveSellingPrice) * 100
 *
 * IMPORTANT: This is only an ESTIMATED PRODUCT GROSS MARGIN.
 * It does NOT include business operating costs.
 *
 * Returns null if required cost data is missing or selling price is zero
 */
export function calculateProductProfit(product: IProduct): ProfitCalculation | null {
  const { price, salePrice, supplierCost } = product;

  // Determine effective selling price
  const effectiveSellingPrice = salePrice && salePrice > 0 ? salePrice : price;

  // Handle zero selling price
  if (!effectiveSellingPrice || effectiveSellingPrice <= 0) {
    return null;
  }

  // Check if we have cost data
  if (!supplierCost) {
    // Missing cost data - return null instead of fake 100% profit
    return {
      effectiveSellingPrice,
      supplierLandedCost: null,
      estimatedGrossProfit: null,
      estimatedGrossMarginPercentage: null,
      hasCostData: false,
    };
  }

  const { unitCost, shippingCost } = supplierCost;

  // Explicitly check for undefined/null (not just zero)
  // Zero is a valid numeric value, undefined/null is missing data
  if (unitCost === undefined || unitCost === null || shippingCost === undefined || shippingCost === null) {
    // Incomplete cost data - return null
    return {
      effectiveSellingPrice,
      supplierLandedCost: null,
      estimatedGrossProfit: null,
      estimatedGrossMarginPercentage: null,
      hasCostData: false,
    };
  }

  // Calculate landed cost (explicit zeros are valid)
  const supplierLandedCost = unitCost + shippingCost;

  // Calculate gross profit
  const estimatedGrossProfit = effectiveSellingPrice - supplierLandedCost;

  // Calculate margin percentage (safe division by zero check already done above)
  const estimatedGrossMarginPercentage = (estimatedGrossProfit / effectiveSellingPrice) * 100;

  return {
    effectiveSellingPrice,
    supplierLandedCost,
    estimatedGrossProfit,
    estimatedGrossMarginPercentage,
    hasCostData: true,
  };
}

/**
 * Formats a margin percentage for display
 */
export function formatMarginPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Example calculation:
 * Selling price: $29.99
 * Supplier cost: $7
 * Supplier shipping: $3
 * Landed cost = $10
 * Estimated gross product profit = $19.99
 * Margin = (19.99 / 29.99) * 100 = 66.66%
 */
