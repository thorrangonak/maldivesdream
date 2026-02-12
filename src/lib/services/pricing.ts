import prisma from "@/lib/db/client";
import { getStayDates } from "@/lib/utils";
import type { NightlyRate, PricingBreakdown } from "@/types";
import { computeTotals } from "./pricing-calc";

// Re-export for convenience
export { computeTotals } from "./pricing-calc";

/**
 * Calculate the full pricing breakdown for a stay.
 * Returns null if any night is missing a seasonal price.
 */
export async function calculatePricing(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  roomQty: number,
  currency = "USD"
): Promise<{ breakdown: PricingBreakdown; missingDates: string[] }> {
  const stayDates = getStayDates(checkIn, checkOut);

  // Load all active seasons that overlap the stay
  const seasons = await prisma.season.findMany({
    where: {
      active: true,
      startDate: { lte: new Date(checkOut) },
      endDate: { gte: new Date(checkIn) },
    },
    include: {
      prices: {
        where: { roomTypeId, active: true, currency },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const nightlyRates: NightlyRate[] = [];
  const missingDates: string[] = [];

  for (const dateStr of stayDates) {
    const date = new Date(dateStr);
    const matchingSeason = seasons.find(
      (s) => date >= s.startDate && date <= s.endDate
    );

    if (!matchingSeason || matchingSeason.prices.length === 0) {
      missingDates.push(dateStr);
      continue;
    }

    const price = matchingSeason.prices[0];
    nightlyRates.push({
      date: dateStr,
      price: Number(price.nightlyPrice),
      seasonName: matchingSeason.name,
    });
  }

  const breakdown = computeTotals(nightlyRates, roomQty, currency);
  return { breakdown, missingDates };
}
