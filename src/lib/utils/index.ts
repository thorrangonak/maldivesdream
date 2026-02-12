import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, eachDayOfInterval, differenceInDays } from "date-fns";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string to YYYY-MM-DD */
export function toDateStr(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/** Get all dates in a check-in to check-out range (nights, not including checkout day) */
export function getStayDates(checkIn: string, checkOut: string): string[] {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  // eachDayOfInterval includes both endpoints; we exclude checkout date
  const days = eachDayOfInterval({ start, end });
  return days.slice(0, -1).map((d) => format(d, "yyyy-MM-dd"));
}

/** Calculate number of nights */
export function getNights(checkIn: string, checkOut: string): number {
  return differenceInDays(parseISO(checkOut), parseISO(checkIn));
}

/** Format currency for display */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Generate a short human-friendly reservation code */
export function generateReservationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 for clarity
  let code = "MD-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Sleep helper for retries */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Safe JSON parse */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
