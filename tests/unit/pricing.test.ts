import { describe, it, expect } from "vitest";
import { computeTotals } from "@/lib/services/pricing-calc";
import type { NightlyRate } from "@/types";

describe("Pricing Engine", () => {
  const TAX_RATE = 0.12;
  const GREEN_TAX_PER_NIGHT = 6;

  it("calculates correct totals for a 3-night stay, 1 room", () => {
    const rates: NightlyRate[] = [
      { date: "2026-03-01", price: 500, seasonName: "Peak" },
      { date: "2026-03-02", price: 500, seasonName: "Peak" },
      { date: "2026-03-03", price: 500, seasonName: "Peak" },
    ];

    const result = computeTotals(rates, 1, "USD");

    expect(result.subtotal).toBe(1500);
    expect(result.taxes).toBe(180); // 1500 * 0.12
    expect(result.fees).toBe(18); // 6 * 3 nights * 1 room
    expect(result.total).toBe(1698); // 1500 + 180 + 18
    expect(result.currency).toBe("USD");
    expect(result.roomQty).toBe(1);
  });

  it("calculates correct totals for 2 rooms", () => {
    const rates: NightlyRate[] = [
      { date: "2026-03-01", price: 300, seasonName: "Green" },
      { date: "2026-03-02", price: 300, seasonName: "Green" },
    ];

    const result = computeTotals(rates, 2, "USD");

    // subtotal = (300 + 300) * 2 rooms = 1200
    expect(result.subtotal).toBe(1200);
    // taxes = 1200 * 0.12 = 144
    expect(result.taxes).toBe(144);
    // fees = 6 * 2 nights * 2 rooms = 24
    expect(result.fees).toBe(24);
    // total = 1200 + 144 + 24 = 1368
    expect(result.total).toBe(1368);
  });

  it("handles mixed seasonal pricing across nights", () => {
    const rates: NightlyRate[] = [
      { date: "2026-04-28", price: 800, seasonName: "Peak" },
      { date: "2026-04-29", price: 800, seasonName: "Peak" },
      { date: "2026-04-30", price: 400, seasonName: "Green" },
      { date: "2026-05-01", price: 400, seasonName: "Green" },
    ];

    const result = computeTotals(rates, 1, "USD");

    expect(result.subtotal).toBe(2400);
    expect(result.taxes).toBe(288);
    expect(result.fees).toBe(24); // 6 * 4 nights
    expect(result.total).toBe(2712);
    expect(result.nightlyRates).toHaveLength(4);
  });

  it("handles single-night stay", () => {
    const rates: NightlyRate[] = [
      { date: "2026-12-25", price: 1200, seasonName: "Holiday" },
    ];

    const result = computeTotals(rates, 1, "USD");

    expect(result.subtotal).toBe(1200);
    expect(result.taxes).toBe(144);
    expect(result.fees).toBe(6);
    expect(result.total).toBe(1350);
  });

  it("returns zero totals for empty rates", () => {
    const result = computeTotals([], 1, "USD");

    expect(result.subtotal).toBe(0);
    expect(result.taxes).toBe(0);
    expect(result.fees).toBe(0);
    expect(result.total).toBe(0);
  });

  it("correctly applies room quantity multiplier to fees and subtotal", () => {
    const rates: NightlyRate[] = [
      { date: "2026-06-01", price: 200, seasonName: "Off-Peak" },
    ];

    const r1 = computeTotals(rates, 1, "USD");
    const r3 = computeTotals(rates, 3, "USD");

    expect(r3.subtotal).toBe(r1.subtotal * 3);
    expect(r3.fees).toBe(r1.fees * 3);
  });
});
