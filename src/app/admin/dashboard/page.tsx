import prisma from "@/lib/db/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building, BedDouble, BookOpen, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [hotelCount, roomTypeCount, pendingReservations, recentRevenue] = await Promise.all([
    prisma.hotel.count({ where: { status: "ACTIVE" } }),
    prisma.roomType.count({ where: { active: true } }),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.reservation.aggregate({
      where: { status: "CONFIRMED", confirmedAt: { gte: thirtyDaysAgo } },
      _sum: { totalAmount: true },
    }),
  ]);

  const revenue = Number(recentRevenue._sum.totalAmount || 0);

  const stats = [
    { label: "Active Hotels", value: hotelCount, icon: Building, color: "text-sky-600 bg-sky-100" },
    { label: "Room Types", value: roomTypeCount, icon: BedDouble, color: "text-teal-600 bg-teal-100" },
    { label: "Pending Bookings", value: pendingReservations, icon: BookOpen, color: "text-yellow-600 bg-yellow-100" },
    { label: "30-Day Revenue", value: formatCurrency(revenue), icon: DollarSign, color: "text-green-600 bg-green-100" },
  ];

  const reservations = await prisma.reservation.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { hotel: { select: { name: true } }, roomType: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500">Welcome to Maldives Dream admin panel</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Recent Reservations</h2>
      {reservations.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No reservations yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Code</th>
                <th className="pb-2 pr-4 font-medium">Guest</th>
                <th className="pb-2 pr-4 font-medium">Hotel</th>
                <th className="pb-2 pr-4 font-medium">Dates</th>
                <th className="pb-2 pr-4 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-mono text-sky-600">{r.code}</td>
                  <td className="py-2.5 pr-4">{r.guestFirstName} {r.guestLastName}</td>
                  <td className="py-2.5 pr-4">{r.hotel.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.checkIn.toISOString().split("T")[0]} — {r.checkOut.toISOString().split("T")[0]}</td>
                  <td className="py-2.5 pr-4 font-medium">{formatCurrency(Number(r.totalAmount))}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "CONFIRMED" ? "bg-green-100 text-green-800" : r.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-600"}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
