import { NextRequest, NextResponse } from "next/server";
import { handleCryptoWebhook } from "@/lib/services/payment";
import { logger } from "@/lib/utils/logger";

/** POST /api/webhooks/crypto — Coinbase Commerce webhook handler */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-cc-webhook-signature") || "";
    await handleCryptoWebhook(body, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Webhook error";
    logger.error("Crypto webhook failed", { error: msg });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
