import prisma from "@/lib/db/client";
import type { RevenueReport, OccupancyReport } from "@/types";

/**
 * Revenue report for a date range, grouped by hotel and payment method.
 */
export async function getRevenueReport(
  startDate: string,
  endDate: string
): Promise<RevenueReport> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const reservations = await prisma.reservation.findMany({
    where: {
      status: "CONFIRMED",
      confirmedAt: { gte: start, lte: end },
    },
    include: {
      hotel: { select: { id: true, name: true } },
      roomType: { select: { id: true, name: true } },
      payments: { where: { status: "COMPLETED" } },
    },
  });

  const totalRevenue = reservations.reduce((s, r) => s + Number(r.totalAmount), 0);

  // Group by hotel
  const hotelMap = new Map<string, { hotelName: string; revenue: number; bookings: number }>();
  for (const r of reservations) {
    const existing = hotelMap.get(r.hotelId) || { hotelName: r.hotel.name, revenue: 0, bookings: 0 };
    existing.revenue += Number(r.totalAmount);
    existing.bookings += 1;
    hotelMap.set(r.hotelId, existing);
  }

  // Group by room type
  const roomMap = new Map<string, { roomTypeName: string; revenue: number; bookings: number }>();
  for (const r of reservations) {
    const existing = roomMap.get(r.roomTypeId) || { roomTypeName: r.roomType.name, revenue: 0, bookings: 0 };
    existing.revenue += Number(r.totalAmount);
    existing.bookings += 1;
    roomMap.set(r.roomTypeId, existing);
  }

  // Group by payment method
  const methodMap = new Map<string, { revenue: number; count: number }>();
  for (const r of reservations) {
    for (const p of r.payments) {
      const existing = methodMap.get(p.provider) || { revenue: 0, count: 0 };
      existing.revenue += Number(p.amount);
      existing.count += 1;
      methodMap.set(p.provider, existing);
    }
  }

  return {
    period: `${startDate} to ${endDate}`,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    bookingCount: reservations.length,
    currency: "USD",
    byHotel: [...hotelMap.entries()].map(([hotelId, d]) => ({ hotelId, ...d })),
    byRoomType: [...roomMap.entries()].map(([roomTypeId, d]) => ({ roomTypeId, ...d })),
    byPaymentMethod: [...methodMap.entries()].map(([provider, d]) => ({ provider, ...d })),
  };
}

/**
 * Occupancy report for a date range.
 */
export async function getOccupancyReport(
  startDate: string,
  endDate: string
): Promise<OccupancyReport> {
  const allotments = await prisma.dailyAllotment.findMany({
    where: {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    include: {
      roomType: { include: { hotel: { select: { id: true, name: true } } } },
    },
  });

  let totalRoomNights = 0;
  let occupiedRoomNights = 0;

  const hotelMap = new Map<string, { hotelName: string; total: number; occupied: number }>();

  for (const a of allotments) {
    totalRoomNights += a.totalRooms;
    occupiedRoomNights += a.bookedRooms;

    const hId = a.roomType.hotel.id;
    const existing = hotelMap.get(hId) || {
      hotelName: a.roomType.hotel.name,
      total: 0,
      occupied: 0,
    };
    existing.total += a.totalRooms;
    existing.occupied += a.bookedRooms;
    hotelMap.set(hId, existing);
  }

  return {
    period: `${startDate} to ${endDate}`,
    totalRoomNights,
    occupiedRoomNights,
    occupancyRate: totalRoomNights > 0
      ? Math.round((occupiedRoomNights / totalRoomNights) * 10000) / 100
      : 0,
    byHotel: [...hotelMap.entries()].map(([hotelId, d]) => ({
      hotelId,
      hotelName: d.hotelName,
      rate: d.total > 0 ? Math.round((d.occupied / d.total) * 10000) / 100 : 0,
    })),
  };
}
