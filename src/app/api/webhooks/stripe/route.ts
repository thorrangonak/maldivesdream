import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/services/payment";
import { logger } from "@/lib/utils/logger";

/** POST /api/webhooks/stripe — Stripe webhook handler */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    await handleStripeWebhook(body, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Webhook error";
    logger.error("Stripe webhook failed", { error: msg });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
