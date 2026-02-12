import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-sky-600">Maldives Dream</h3>
            <p className="mt-2 text-sm text-slate-500">
              Your gateway to paradise. Curated luxury resorts across the Maldives.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Quick Links</h4>
            <ul className="mt-2 space-y-1">
              <li><Link href="/hotels" className="text-sm text-slate-500 hover:text-sky-600">All Resorts</Link></li>
              <li><Link href="/manage-booking" className="text-sm text-slate-500 hover:text-sky-600">Manage Booking</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Contact</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              <li>info@maldivesdream.com</li>
              <li>+960 123-4567</li>
              <li>Male, Maldives</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Maldives Dream. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
