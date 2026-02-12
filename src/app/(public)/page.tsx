import Link from "next/link";
import { Search } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-400 text-white">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Your Maldives Paradise Awaits
          </h1>
          <p className="mt-4 text-lg text-white/90 sm:text-xl">
            Discover handpicked luxury resorts across the most stunning atolls.
            Crystal-clear waters, pristine beaches, and unforgettable experiences.
          </p>

          {/* Search bar */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-sky-700 shadow-lg transition hover:bg-sky-50"
            >
              <Search className="h-5 w-5" />
              Browse Resorts
            </Link>
            <Link
              href="/manage-booking"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Manage Booking
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-900">Why Book With Us</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Curated Selection",
              desc: "Every resort is hand-picked and verified for quality, service, and authentic Maldivian hospitality.",
              icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
            },
            {
              title: "Best Price Guarantee",
              desc: "Transparent seasonal pricing with no hidden fees. Pay securely with credit card or cryptocurrency.",
              icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              title: "Instant Confirmation",
              desc: "Real-time availability and instant booking confirmations sent to your email.",
              icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-8 text-center transition hover:shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
                <svg className="h-7 w-7 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sky-600 py-16 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to Escape to Paradise?</h2>
        <p className="mt-2 text-lg text-sky-100">Browse our collection and find your perfect island retreat.</p>
        <Link
          href="/hotels"
          className="mt-6 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-sky-700 shadow-lg transition hover:bg-sky-50"
        >
          Explore All Resorts
        </Link>
      </section>
    </>
  );
}
