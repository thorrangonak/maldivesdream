import prisma from "@/lib/db/client";
import { getStayDates } from "@/lib/utils";
import { calculatePricing } from "./pricing";
import type { AvailabilityResult } from "@/types";
import { logger } from "@/lib/utils/logger";

/**
 * Check availability for a room type across a date range.
 * Uses the daily_allotments table for atomic availability tracking.
 */
export async function checkAvailability(
  hotelId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  qty: number
): Promise<AvailabilityResult> {
  const roomType = await prisma.roomType.findFirst({
    where: { id: roomTypeId, hotelId, active: true },
  });

  if (!roomType) {
    return { roomTypeId, available: false, availableRooms: 0, pricing: null, missingPriceDates: [] };
  }

  if (guests > roomType.maxGuests * qty) {
    return { roomTypeId, available: false, availableRooms: 0, pricing: null, missingPriceDates: [] };
  }

  const stayDates = getStayDates(checkIn, checkOut);

  // Get or initialize allotments for each date
  const allotments = await prisma.dailyAllotment.findMany({
    where: {
      roomTypeId,
      date: { in: stayDates.map((d) => new Date(d)) },
    },
  });

  // For dates without allotments, assume full inventory
  const allotmentMap = new Map(allotments.map((a) => [a.date.toISOString().split("T")[0], a]));
  let minAvailable = roomType.inventoryCount;

  for (const dateStr of stayDates) {
    const allotment = allotmentMap.get(dateStr);
    const available = allotment
      ? allotment.totalRooms - allotment.bookedRooms - allotment.blockedRooms
      : roomType.inventoryCount;
    minAvailable = Math.min(minAvailable, available);
  }

  const isAvailable = minAvailable >= qty;

  // Calculate pricing
  const { breakdown, missingDates } = await calculatePricing(roomTypeId, checkIn, checkOut, qty);

  // Block booking if any date lacks pricing
  if (missingDates.length > 0) {
    logger.warn("Missing seasonal prices for dates", { roomTypeId, missingDates });
    return {
      roomTypeId,
      available: false,
      availableRooms: minAvailable,
      pricing: null,
      missingPriceDates: missingDates,
    };
  }

  return {
    roomTypeId,
    available: isAvailable,
    availableRooms: minAvailable,
    pricing: isAvailable ? breakdown : null,
    missingPriceDates: [],
  };
}

/**
 * Check availability for ALL room types at a hotel for the given dates.
 */
export async function checkHotelAvailability(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  qty: number
): Promise<AvailabilityResult[]> {
  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId, active: true },
    orderBy: { name: "asc" },
  });

  const results = await Promise.all(
    roomTypes.map((rt) => checkAvailability(hotelId, rt.id, checkIn, checkOut, guests, qty))
  );

  return results;
}

/**
 * Initialize daily allotments for a room type for a date range.
 * Call this when creating/updating a room type's inventory.
 */
export async function ensureAllotments(
  roomTypeId: string,
  startDate: string,
  endDate: string,
  totalRooms: number
): Promise<void> {
  const dates = getStayDates(startDate, endDate + "T00:00:00"); // include endDate
  // Add the end date itself
  dates.push(endDate);

  for (const dateStr of dates) {
    await prisma.dailyAllotment.upsert({
      where: { roomTypeId_date: { roomTypeId, date: new Date(dateStr) } },
      create: { roomTypeId, date: new Date(dateStr), totalRooms, bookedRooms: 0, blockedRooms: 0 },
      update: { totalRooms },
    });
  }
}
