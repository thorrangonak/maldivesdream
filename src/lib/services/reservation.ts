import prisma from "@/lib/db/client";
import { getNights, generateReservationCode, getStayDates } from "@/lib/utils";
import { checkAvailability } from "./availability";
import { logger } from "@/lib/utils/logger";
import type { BookingRequest } from "@/types";

/**
 * Create a reservation with atomic availability check.
 * Uses a Prisma interactive transaction to prevent double-booking.
 */
export async function createReservation(input: BookingRequest) {
  const nights = getNights(input.checkIn, input.checkOut);
  if (nights < 1) throw new Error("Stay must be at least 1 night");

  // Pre-check availability (non-atomic, for fast-fail)
  const avail = await checkAvailability(
    input.hotelId,
    input.roomTypeId,
    input.checkIn,
    input.checkOut,
    input.guestCount,
    input.roomQty
  );

  if (!avail.available || !avail.pricing) {
    if (avail.missingPriceDates.length > 0) {
      throw new Error(`Pricing not configured for dates: ${avail.missingPriceDates.join(", ")}`);
    }
    throw new Error("Rooms not available for the selected dates");
  }

  // Atomic reservation creation inside a transaction
  const reservation = await prisma.$transaction(async (tx) => {
    const stayDates = getStayDates(input.checkIn, input.checkOut);

    // Lock and decrement allotments for each date
    for (const dateStr of stayDates) {
      const date = new Date(dateStr);

      // Upsert ensures allotment row exists
      const allotment = await tx.dailyAllotment.upsert({
        where: {
          roomTypeId_date: { roomTypeId: input.roomTypeId, date },
        },
        create: {
          roomTypeId: input.roomTypeId,
          date,
          totalRooms: (await tx.roomType.findUniqueOrThrow({ where: { id: input.roomTypeId } }))
            .inventoryCount,
          bookedRooms: input.roomQty,
        },
        update: {
          bookedRooms: { increment: input.roomQty },
        },
      });

      // Verify we haven't exceeded capacity
      const available = allotment.totalRooms - allotment.bookedRooms - allotment.blockedRooms;
      if (available < 0) {
        throw new Error(`No rooms available on ${dateStr}`);
      }
    }

    // Create the reservation
    const res = await tx.reservation.create({
      data: {
        code: generateReservationCode(),
        hotelId: input.hotelId,
        roomTypeId: input.roomTypeId,
        guestFirstName: input.guestFirstName,
        guestLastName: input.guestLastName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        guestCountry: input.guestCountry,
        checkIn: new Date(input.checkIn),
        checkOut: new Date(input.checkOut),
        nights,
        roomQty: input.roomQty,
        guestCount: input.guestCount,
        pricingBreakdown: avail.pricing! as object,
        totalAmount: avail.pricing!.total,
        currency: avail.pricing!.currency,
        specialRequests: input.specialRequests,
        status: "PENDING",
      },
    });

    return res;
  }, {
    isolationLevel: "Serializable", // strongest isolation to prevent double-booking
    timeout: 15000,
  });

  logger.info("Reservation created", {
    reservationId: reservation.id,
    code: reservation.code,
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });

  return reservation;
}

/**
 * Cancel a reservation and release allotments.
 */
export async function cancelReservation(reservationId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUniqueOrThrow({
      where: { id: reservationId },
    });

    if (reservation.status === "CANCELLED" || reservation.status === "REFUNDED") {
      throw new Error("Reservation is already cancelled");
    }

    // Release allotments
    const stayDates = getStayDates(
      reservation.checkIn.toISOString().split("T")[0],
      reservation.checkOut.toISOString().split("T")[0]
    );

    for (const dateStr of stayDates) {
      await tx.dailyAllotment.update({
        where: {
          roomTypeId_date: {
            roomTypeId: reservation.roomTypeId,
            date: new Date(dateStr),
          },
        },
        data: { bookedRooms: { decrement: reservation.roomQty } },
      });
    }

    // Update reservation status
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    logger.info("Reservation cancelled", { reservationId, reason });
    return updated;
  });
}

/**
 * Confirm a reservation (called after successful payment).
 */
export async function confirmReservation(reservationId: string) {
  const reservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });
  logger.info("Reservation confirmed", { reservationId });
  return reservation;
}
