"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface RoomOption {
  id: string;
  name: string;
  maxGuests: number;
}

export function BookingWidget({
  hotelId,
  roomTypes,
}: {
  hotelId: string;
  roomTypes: RoomOption[];
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [roomQty, setRoomQty] = useState(1);
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    pricing?: { total: number; currency: string; nightlyRates: { date: string; price: number }[] };
    missingPriceDates?: string[];
  } | null>(null);
  const [error, setError] = useState("");

  async function checkAvail() {
    if (!checkIn || !checkOut || !roomTypeId) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    setAvailability(null);

    try {
      const params = new URLSearchParams({
        hotelId,
        roomTypeId,
        checkIn,
        checkOut,
        guests: String(guests),
        qty: String(roomQty),
      });
      const res = await fetch(`/api/availability?${params}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      setAvailability(json.data);
    } catch {
      setError("Failed to check availability");
    } finally {
      setLoading(false);
    }
  }

  function proceedToBooking() {
    const params = new URLSearchParams({
      hotelId,
      roomTypeId,
      checkIn,
      checkOut,
      guests: String(guests),
      qty: String(roomQty),
    });
    router.push(`/booking?${params}`);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-slate-900">Book Your Stay</h3>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Room Type</label>
          <select
            value={roomTypeId}
            onChange={(e) => {
              setRoomTypeId(e.target.value);
              setAvailability(null);
            }}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name} (max {rt.maxGuests} guests)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Check-in"
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => { setCheckIn(e.target.value); setAvailability(null); }}
          />
          <Input
            label="Check-out"
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => { setCheckOut(e.target.value); setAvailability(null); }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Guests"
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
          <Input
            label="Rooms"
            type="number"
            min={1}
            max={10}
            value={roomQty}
            onChange={(e) => setRoomQty(Number(e.target.value))}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={checkAvail} loading={loading} className="w-full" size="lg">
          Check Availability
        </Button>

        {/* Availability result */}
        {availability && (
          <div className="mt-4 space-y-3">
            {availability.available && availability.pricing ? (
              <>
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="font-semibold text-green-800">Available!</p>
                  <div className="mt-2 space-y-1 text-sm text-green-700">
                    {availability.pricing.nightlyRates.map((r) => (
                      <div key={r.date} className="flex justify-between">
                        <span>{r.date}</span>
                        <span>{formatCurrency(r.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-green-200 pt-3">
                    <div className="flex justify-between font-bold text-green-900">
                      <span>Total</span>
                      <span>{formatCurrency(availability.pricing.total, availability.pricing.currency)}</span>
                    </div>
                  </div>
                </div>
                <Button onClick={proceedToBooking} className="w-full" size="lg">
                  Continue to Booking
                </Button>
              </>
            ) : (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="font-semibold text-red-800">Not Available</p>
                {availability.missingPriceDates && availability.missingPriceDates.length > 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    Pricing not configured for: {availability.missingPriceDates.join(", ")}
                  </p>
                )}
                <p className="mt-1 text-sm text-red-600">
                  Try different dates or room type.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
