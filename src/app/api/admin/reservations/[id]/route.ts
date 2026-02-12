import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { updateReservationSchema } from "@/lib/validators";
import { requireSession, auditLog } from "@/lib/services/auth";
import { cancelReservation, confirmReservation } from "@/lib/services/reservation";
import { refundStripePayment } from "@/lib/services/payment";
import { sendBookingConfirmation } from "@/lib/email";

/** GET /api/admin/reservations/:id */
export const GET = withErrorHandler(async (_req, ctx) => {
  await requireSession("STAFF");
  const { id } = await ctx.params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      hotel: true,
      roomType: true,
      payments: true,
    },
  });
  if (!reservation) return err("Reservation not found", 404);
  return ok(reservation);
});

/** PATCH /api/admin/reservations/:id — change status */
export const PATCH = withErrorHandler(async (req: NextRequest, ctx) => {
  const session = await requireSession("ADMIN");
  const { id } = await ctx.params;
  const body = await req.json();
  const data = updateReservationSchema.parse(body);

  const before = await prisma.reservation.findUnique({
    where: { id },
    include: { hotel: true, roomType: true },
  });
  if (!before) return err("Reservation not found", 404);

  let result;

  switch (data.status) {
    case "CONFIRMED":
      result = await confirmReservation(id);
      // Send confirmation email
      await sendBookingConfirmation({
        guestName: `${before.guestFirstName} ${before.guestLastName}`,
        guestEmail: before.guestEmail,
        reservationCode: before.code,
        hotelName: before.hotel.name,
        roomTypeName: before.roomType.name,
        checkIn: before.checkIn.toISOString().split("T")[0],
        checkOut: before.checkOut.toISOString().split("T")[0],
        nights: before.nights,
        roomQty: before.roomQty,
        totalAmount: Number(before.totalAmount),
        currency: before.currency,
      });
      break;

    case "CANCELLED":
      result = await cancelReservation(id, data.cancelReason);
      break;

    case "REFUNDED":
      // First attempt Stripe refund
      try {
        await refundStripePayment(id);
      } catch {
        // If no Stripe payment, mark as manual refund
      }
      result = await prisma.reservation.update({
        where: { id },
        data: { status: "REFUNDED" },
      });
      break;

    default:
      return err("Invalid status transition", 400);
  }

  await auditLog(session.userId, `reservation.${data.status?.toLowerCase()}`, "Reservation", id, before, result);
  return ok(result);
});
