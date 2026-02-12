import { NextRequest } from "next/server";
import { ok, withErrorHandler } from "@/lib/api-utils";
import { createCryptoCheckoutSchema } from "@/lib/validators";
import { createCryptoCheckout } from "@/lib/services/payment";

/** POST /api/payments/crypto/checkout — create crypto payment */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { reservationId } = createCryptoCheckoutSchema.parse(body);
  const result = await createCryptoCheckout(reservationId);
  return ok(result);
});
