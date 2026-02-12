"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export function ConfirmationContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-slate-900">Booking Confirmed!</h1>
      <p className="mt-2 text-lg text-slate-500">
        Thank you for choosing Maldives Dream. Your reservation has been confirmed.
      </p>

      {code && (
        <div className="mt-8 rounded-xl bg-slate-50 p-6">
          <p className="text-sm text-slate-500">Your confirmation code</p>
          <p className="mt-1 text-3xl font-bold tracking-widest text-sky-600">{code}</p>
          <p className="mt-3 text-sm text-slate-500">
            A confirmation email has been sent to your email address.
            Use this code to manage your booking.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/manage-booking"
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Manage Booking
        </Link>
        <Link
          href="/hotels"
          className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Browse More Resorts
        </Link>
      </div>
    </div>
  );
}
