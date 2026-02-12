import Stripe from "stripe";
import prisma from "@/lib/db/client";
import { confirmReservation } from "./reservation";
import { logger } from "@/lib/utils/logger";

// ─── Stripe ──────────────────────────────────────────────────────────────────

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

/**
 * Create a Stripe Checkout session for a reservation.
 */
export async function createStripeSession(reservationId: string) {
  const reservation = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId },
    include: { hotel: true, roomType: true },
  });

  if (reservation.status !== "PENDING") {
    throw new Error("Reservation is not in PENDING status");
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: reservation.currency.toLowerCase(),
          unit_amount: Math.round(Number(reservation.totalAmount) * 100), // cents
          product_data: {
            name: `${reservation.hotel.name} — ${reservation.roomType.name}`,
            description: `${reservation.nights} nights, ${reservation.roomQty} room(s) | Check-in: ${reservation.checkIn.toISOString().split("T")[0]}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      reservationId: reservation.id,
      reservationCode: reservation.code,
    },
    customer_email: reservation.guestEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/confirmation?code=${reservation.code}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking?cancelled=true`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min expiry
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      reservationId,
      provider: "STRIPE",
      amount: reservation.totalAmount,
      currency: reservation.currency,
      status: "PENDING",
      providerTxId: session.id,
      checkoutUrl: session.url,
    },
  });

  logger.info("Stripe session created", { reservationId, sessionId: session.id });
  return { sessionUrl: session.url, sessionId: session.id };
}

/**
 * Handle Stripe webhook events.
 */
export async function handleStripeWebhook(payload: string, signature: string) {
  const event = getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const reservationId = session.metadata?.reservationId;
      if (!reservationId) {
        logger.error("Stripe webhook: missing reservationId in metadata");
        return;
      }

      // Update payment
      await prisma.payment.updateMany({
        where: { providerTxId: session.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          providerData: event as object,
        },
      });

      // Confirm reservation
      await confirmReservation(reservationId);
      logger.info("Stripe payment completed", { reservationId, sessionId: session.id });
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await prisma.payment.updateMany({
        where: { providerTxId: session.id },
        data: { status: "FAILED", failedAt: new Date(), providerData: event as object },
      });
      logger.info("Stripe session expired", { sessionId: session.id });
      break;
    }

    default:
      logger.info("Unhandled Stripe event", { type: event.type });
  }
}

/**
 * Issue a Stripe refund for a reservation.
 */
export async function refundStripePayment(reservationId: string) {
  const payment = await prisma.payment.findFirst({
    where: { reservationId, provider: "STRIPE", status: "COMPLETED" },
  });
  if (!payment) throw new Error("No completed Stripe payment found");

  // The providerTxId is the checkout session ID; we need the payment intent
  const session = await getStripe().checkout.sessions.retrieve(payment.providerTxId!);
  if (!session.payment_intent) throw new Error("No payment intent on session");

  const refund = await getStripe().refunds.create({
    payment_intent: session.payment_intent as string,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "REFUNDED", refundedAt: new Date(), providerData: { refundId: refund.id } },
  });

  logger.info("Stripe refund issued", { reservationId, refundId: refund.id });
  return refund;
}

// ─── Crypto (Coinbase Commerce) ─────────────────────────────────────────────

/**
 * Create a Coinbase Commerce charge for a reservation.
 */
export async function createCryptoCheckout(reservationId: string) {
  const reservation = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId },
    include: { hotel: true },
  });

  if (reservation.status !== "PENDING") {
    throw new Error("Reservation is not in PENDING status");
  }

  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
  if (!apiKey) throw new Error("Crypto payments not configured");

  const response = await fetch("https://api.commerce.coinbase.com/charges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": apiKey,
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name: `${reservation.hotel.name} Booking`,
      description: `Reservation ${reservation.code}`,
      pricing_type: "fixed_price",
      local_price: {
        amount: Number(reservation.totalAmount).toFixed(2),
        currency: reservation.currency,
      },
      metadata: {
        reservationId: reservation.id,
        reservationCode: reservation.code,
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/confirmation?code=${reservation.code}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking?cancelled=true`,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error("Coinbase Commerce charge creation failed", { error: err });
    throw new Error("Failed to create crypto checkout");
  }

  const { data } = await response.json();

  await prisma.payment.create({
    data: {
      reservationId,
      provider: "CRYPTO",
      amount: reservation.totalAmount,
      currency: reservation.currency,
      status: "PENDING",
      providerTxId: data.code,
      checkoutUrl: data.hosted_url,
    },
  });

  logger.info("Crypto checkout created", { reservationId, chargeCode: data.code });
  return { checkoutUrl: data.hosted_url, chargeCode: data.code };
}

/**
 * Handle Coinbase Commerce webhook events.
 */
export async function handleCryptoWebhook(payload: string, signature: string) {
  // Verify webhook signature
  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha256", process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!);
  hmac.update(payload);
  const computedSig = hmac.digest("hex");

  if (computedSig !== signature) {
    throw new Error("Invalid webhook signature");
  }

  const event = JSON.parse(payload);
  const chargeCode = event.event?.data?.code;
  const reservationId = event.event?.data?.metadata?.reservationId;

  if (!chargeCode || !reservationId) {
    logger.warn("Crypto webhook: missing data", { event: event.event?.type });
    return;
  }

  switch (event.event?.type) {
    case "charge:confirmed": {
      await prisma.payment.updateMany({
        where: { providerTxId: chargeCode },
        data: { status: "COMPLETED", completedAt: new Date(), providerData: event },
      });
      await confirmReservation(reservationId);
      logger.info("Crypto payment confirmed", { reservationId, chargeCode });
      break;
    }

    case "charge:failed": {
      await prisma.payment.updateMany({
        where: { providerTxId: chargeCode },
        data: { status: "FAILED", failedAt: new Date(), providerData: event },
      });
      logger.info("Crypto payment failed", { reservationId, chargeCode });
      break;
    }

    default:
      logger.info("Unhandled crypto event", { type: event.event?.type });
  }
}
