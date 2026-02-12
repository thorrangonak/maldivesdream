import { NextRequest } from "next/server";
import { ok, withErrorHandler } from "@/lib/api-utils";
import { createStripeSessionSchema } from "@/lib/validators";
import { createStripeSession } from "@/lib/services/payment";

/** POST /api/payments/stripe/session — create Stripe Checkout session */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { reservationId } = createStripeSessionSchema.parse(body);
  const result = await createStripeSession(reservationId);
  return ok(result);
});
