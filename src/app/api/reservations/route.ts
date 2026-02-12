import { NextRequest } from "next/server";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { createReservationSchema } from "@/lib/validators";
import { createReservation } from "@/lib/services/reservation";

/** POST /api/reservations — create a pending reservation */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const data = createReservationSchema.parse(body);

  const reservation = await createReservation(data);

  return ok(
    {
      reservationId: reservation.id,
      code: reservation.code,
      totalAmount: Number(reservation.totalAmount),
      currency: reservation.currency,
      status: reservation.status,
    },
    201
  );
});
