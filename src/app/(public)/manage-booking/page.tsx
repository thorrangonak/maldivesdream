"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface BookingDetails {
  code: string;
  status: string;
  hotel: { name: string; island: string; checkInTime: string; checkOutTime: string };
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomQty: number;
  guestCount: number;
  totalAmount: number;
  currency: string;
  guestName: string;
  paymentStatus: string;
  confirmedAt: string | null;
  createdAt: string;
}

export default function ManageBookingPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const res = await fetch("/api/manage-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
      } else {
        setBooking(json.data);
      }
    } catch {
      setError("Failed to look up booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Manage Your Booking</h1>
      <p className="mt-1 text-slate-500">Enter your confirmation code and email to view your reservation.</p>

      <form onSubmit={handleLookup} className="mt-6 space-y-4">
        <Input
          label="Confirmation Code"
          placeholder="MD-XXXXXXXX"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} size="lg" className="w-full">
          Look Up Booking
        </Button>
      </form>

      {booking && (
        <div className="mt-8 rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{booking.hotel.name}</h2>
            <Badge status={booking.status} />
          </div>
          <p className="text-sm text-slate-500">{booking.hotel.island}</p>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-slate-500">Confirmation Code</span>
              <p className="font-mono font-bold text-sky-600">{booking.code}</p>
            </div>
            <div>
              <span className="text-slate-500">Guest</span>
              <p className="font-medium">{booking.guestName}</p>
            </div>
            <div>
              <span className="text-slate-500">Room</span>
              <p className="font-medium">{booking.roomType} x{booking.roomQty}</p>
            </div>
            <div>
              <span className="text-slate-500">Guests</span>
              <p className="font-medium">{booking.guestCount}</p>
            </div>
            <div>
              <span className="text-slate-500">Check-in</span>
              <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()} at {booking.hotel.checkInTime}</p>
            </div>
            <div>
              <span className="text-slate-500">Check-out</span>
              <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()} at {booking.hotel.checkOutTime}</p>
            </div>
            <div>
              <span className="text-slate-500">Duration</span>
              <p className="font-medium">{booking.nights} night{booking.nights > 1 ? "s" : ""}</p>
            </div>
            <div>
              <span className="text-slate-500">Payment</span>
              <p><Badge status={booking.paymentStatus} /></p>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4 text-right">
            <span className="text-sm text-slate-500">Total:</span>
            <span className="ml-2 text-xl font-bold text-sky-600">
              {formatCurrency(booking.totalAmount, booking.currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
