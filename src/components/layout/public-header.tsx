"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-sky-600">Maldives Dream</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/hotels" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
            Resorts
          </Link>
          <Link href="/manage-booking" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
            Manage Booking
          </Link>
          <Link
            href="/hotels"
            className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            Book Now
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-4">
            <Link href="/hotels" className="text-sm font-medium text-slate-700" onClick={() => setOpen(false)}>
              Resorts
            </Link>
            <Link href="/manage-booking" className="text-sm font-medium text-slate-700" onClick={() => setOpen(false)}>
              Manage Booking
            </Link>
            <Link
              href="/hotels"
              className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Book Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
