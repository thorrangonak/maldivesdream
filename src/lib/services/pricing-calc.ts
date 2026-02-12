/**
 * Pure pricing calculation functions — no database dependency.
 * Used by both the pricing service and unit tests.
 */
import type { NightlyRate, PricingBreakdown } from "@/types";

export const TAX_RATE = 0.12; // 12% GST
export const GREEN_TAX_PER_NIGHT = 6; // USD per room per night

/**
 * Compute totals from pre-fetched nightly rates.
 */
export function computeTotals(
  nightlyRates: NightlyRate[],
  roomQty: number,
  currency = "USD"
): PricingBreakdown {
  const subtotal = nightlyRates.reduce((sum, r) => sum + r.price, 0) * roomQty;
  const greenTax = GREEN_TAX_PER_NIGHT * nightlyRates.length * roomQty;
  const taxes = Math.round(subtotal * TAX_RATE * 100) / 100;
  const fees = greenTax;
  const discount = 0;
  const total = Math.round((subtotal + taxes + fees - discount) * 100) / 100;

  return { nightlyRates, subtotal, taxes, fees, discount, total, currency, roomQty };
}
