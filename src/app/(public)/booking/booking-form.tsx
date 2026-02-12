"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface PricingData {
  available: boolean;
  pricing: {
    nightlyRates: { date: string; price: number; seasonName: string }[];
    subtotal: number;
    taxes: number;
    fees: number;
    discount: number;
    total: number;
    currency: string;
    roomQty: number;
  };
}

export default function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hotelId = searchParams.get("hotelId") || "";
  const roomTypeId = searchParams.get("roomTypeId") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = parseInt(searchParams.get("guests") || "2");
  const qty = parseInt(searchParams.get("qty") || "1");

  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [form, setForm] = useState({
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
    guestCountry: "",
    specialRequests: "",
  });
  const [payMethod, setPayMethod] = useState<"stripe" | "crypto">("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch availability/pricing on mount
  useEffect(() => {
    if (!hotelId || !roomTypeId || !checkIn || !checkOut) return;
    const params = new URLSearchParams({ hotelId, roomTypeId, checkIn, checkOut, guests: String(guests), qty: String(qty) });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPricingData(json.data);
        else setError(json.error);
      })
      .catch(() => setError("Failed to load pricing"));
  }, [hotelId, roomTypeId, checkIn, checkOut, guests, qty]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create reservation
      const resResp = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          roomTypeId,
          checkIn,
          checkOut,
          guestCount: guests,
          roomQty: qty,
          ...form,
        }),
      });
      const resJson = await resResp.json();
      if (!resJson.success) {
        setError(resJson.error);
        return;
      }

      const { reservationId } = resJson.data;

      // 2. Create payment session
      if (payMethod === "stripe") {
        const payResp = await fetch("/api/payments/stripe/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId }),
        });
        const payJson = await payResp.json();
        if (!payJson.success) {
          setError(payJson.error);
          return;
        }
        // Redirect to Stripe Checkout
        window.location.href = payJson.data.sessionUrl;
      } else {
        const payResp = await fetch("/api/payments/crypto/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId }),
        });
        const payJson = await payResp.json();
        if (!payJson.success) {
          setError(payJson.error);
          return;
        }
        // Redirect to Coinbase Commerce
        window.location.href = payJson.data.checkoutUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!hotelId || !roomTypeId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Invalid Booking</h1>
        <p className="mt-2 text-slate-500">Please select a hotel and room first.</p>
        <Button onClick={() => router.push("/hotels")} className="mt-4">
          Browse Hotels
        </Button>
      </div>
    );
  }

  const pricing = pricingData?.pricing;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Complete Your Booking</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Guest Details</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                label="First Name *"
                required
                value={form.guestFirstName}
                onChange={(e) => setForm({ ...form, guestFirstName: e.target.value })}
              />
              <Input
                label="Last Name *"
                required
                value={form.guestLastName}
                onChange={(e) => setForm({ ...form, guestLastName: e.target.value })}
              />
              <Input
                label="Email *"
                type="email"
                required
                value={form.guestEmail}
                onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
              />
              <Input
                label="Phone"
                type="tel"
                value={form.guestPhone}
                onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
              />
              <Input
                label="Country Code"
                placeholder="US"
                maxLength={2}
                value={form.guestCountry}
                onChange={(e) => setForm({ ...form, guestCountry: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Special Requests</label>
            <textarea
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              rows={3}
              maxLength={2000}
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
              placeholder="Airport transfer, dietary requirements, special occasions..."
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment Method</h2>
            <div className="mt-3 flex gap-3">
              <label
                className={`flex-1 cursor-pointer rounded-lg border-2 p-4 text-center transition ${
                  payMethod === "stripe" ? "border-sky-500 bg-sky-50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={payMethod === "stripe"}
                  onChange={() => setPayMethod("stripe")}
                />
                <p className="font-semibold text-slate-900">Credit Card</p>
                <p className="mt-1 text-xs text-slate-500">Visa, Mastercard, Amex</p>
              </label>
              <label
                className={`flex-1 cursor-pointer rounded-lg border-2 p-4 text-center transition ${
                  payMethod === "crypto" ? "border-sky-500 bg-sky-50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={payMethod === "crypto"}
                  onChange={() => setPayMethod("crypto")}
                />
                <p className="font-semibold text-slate-900">Cryptocurrency</p>
                <p className="mt-1 text-xs text-slate-500">BTC, ETH, USDC</p>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full">
            {payMethod === "stripe" ? "Pay with Credit Card" : "Pay with Crypto"}
          </Button>
        </form>

        {/* Price summary sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="font-semibold text-slate-900">Booking Summary</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Check-in: <span className="font-medium text-slate-900">{checkIn}</span></p>
              <p>Check-out: <span className="font-medium text-slate-900">{checkOut}</span></p>
              <p>Guests: <span className="font-medium text-slate-900">{guests}</span></p>
              <p>Rooms: <span className="font-medium text-slate-900">{qty}</span></p>
            </div>

            {pricing && (
              <div className="mt-4 border-t border-slate-200 pt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatCurrency(pricing.subtotal, pricing.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Taxes (12% GST)</span>
                  <span>{formatCurrency(pricing.taxes, pricing.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Green Tax</span>
                  <span>{formatCurrency(pricing.fees, pricing.currency)}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(pricing.discount, pricing.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-sky-600">{formatCurrency(pricing.total, pricing.currency)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
