import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { requireSession } from "@/lib/services/auth";
import { stringify } from "csv-stringify/sync";

/** GET /api/admin/reservations/export?status=&hotelId= — export as CSV */
export async function GET(req: NextRequest) {
  try {
    await requireSession("STAFF");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const hotelId = url.searchParams.get("hotelId") || undefined;

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(status && { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED" }),
      ...(hotelId && { hotelId }),
    },
    include: {
      hotel: { select: { name: true } },
      roomType: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = stringify(
    reservations.map((r) => ({
      Code: r.code,
      Status: r.status,
      Hotel: r.hotel.name,
      Room: r.roomType.name,
      Guest: `${r.guestFirstName} ${r.guestLastName}`,
      Email: r.guestEmail,
      CheckIn: r.checkIn.toISOString().split("T")[0],
      CheckOut: r.checkOut.toISOString().split("T")[0],
      Nights: r.nights,
      Rooms: r.roomQty,
      Total: Number(r.totalAmount),
      Currency: r.currency,
      Created: r.createdAt.toISOString(),
    })),
    { header: true }
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="reservations-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
