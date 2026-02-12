import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { lookupBookingSchema } from "@/lib/validators";

/** POST /api/manage-booking — lookup reservation by code + email */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { code, email } = lookupBookingSchema.parse(body);

  const reservation = await prisma.reservation.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      guestEmail: { equals: email, mode: "insensitive" },
    },
    include: {
      hotel: { select: { name: true, island: true, checkInTime: true, checkOutTime: true } },
      roomType: { select: { name: true } },
      payments: { select: { provider: true, status: true, completedAt: true } },
    },
  });

  if (!reservation) return err("Reservation not found. Please check your code and email.", 404);

  return ok({
    code: reservation.code,
    status: reservation.status,
    hotel: reservation.hotel,
    roomType: reservation.roomType.name,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    nights: reservation.nights,
    roomQty: reservation.roomQty,
    guestCount: reservation.guestCount,
    totalAmount: Number(reservation.totalAmount),
    currency: reservation.currency,
    pricingBreakdown: reservation.pricingBreakdown,
    guestName: `${reservation.guestFirstName} ${reservation.guestLastName}`,
    paymentStatus: reservation.payments[0]?.status || "PENDING",
    confirmedAt: reservation.confirmedAt,
    createdAt: reservation.createdAt,
  });
});
