import { describe, it, expect } from "vitest";
import {
  getStayDates,
  getNights,
  formatCurrency,
  generateReservationCode,
  toDateStr,
} from "@/lib/utils";

describe("Utility Functions", () => {
  describe("getStayDates", () => {
    it("returns correct dates for a 3-night stay", () => {
      const dates = getStayDates("2026-03-01", "2026-03-04");
      expect(dates).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
    });

    it("returns single date for 1-night stay", () => {
      const dates = getStayDates("2026-06-15", "2026-06-16");
      expect(dates).toEqual(["2026-06-15"]);
    });

    it("handles month boundaries", () => {
      const dates = getStayDates("2026-01-30", "2026-02-02");
      expect(dates).toEqual(["2026-01-30", "2026-01-31", "2026-02-01"]);
    });
  });

  describe("getNights", () => {
    it("calculates correct number of nights", () => {
      expect(getNights("2026-03-01", "2026-03-04")).toBe(3);
      expect(getNights("2026-12-31", "2027-01-02")).toBe(2);
      expect(getNights("2026-06-15", "2026-06-16")).toBe(1);
    });
  });

  describe("formatCurrency", () => {
    it("formats USD correctly", () => {
      expect(formatCurrency(1500)).toBe("$1,500");
      expect(formatCurrency(99.99)).toBe("$99.99");
      expect(formatCurrency(0)).toBe("$0");
    });
  });

  describe("generateReservationCode", () => {
    it("starts with MD- and is 11 characters", () => {
      const code = generateReservationCode();
      expect(code).toMatch(/^MD-[A-Z2-9]{8}$/);
    });

    it("generates unique codes", () => {
      const codes = new Set(Array.from({ length: 100 }, () => generateReservationCode()));
      expect(codes.size).toBe(100);
    });
  });
});
