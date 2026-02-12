import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Maldives Dream — Luxury Maldives Resort Bookings",
  description:
    "Book your dream Maldives getaway. Browse luxury resorts, water villas, and overwater bungalows across the most stunning atolls.",
  keywords: ["Maldives", "resort", "booking", "luxury", "water villa", "overwater bungalow"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
