import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, withErrorHandler } from "@/lib/api-utils";
import { paginationSchema } from "@/lib/validators";
import { requireSession } from "@/lib/services/auth";

/** GET /api/admin/reservations — list with filters */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireSession("STAFF");
  const url = new URL(req.url);
  const { page, pageSize } = paginationSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const status = url.searchParams.get("status") || undefined;
  const hotelId = url.searchParams.get("hotelId") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const where = {
    ...(status && { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED" }),
    ...(hotelId && { hotelId }),
    ...(search && {
      OR: [
        { code: { contains: search, mode: "insensitive" as const } },
        { guestEmail: { contains: search, mode: "insensitive" as const } },
        { guestLastName: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        hotel: { select: { id: true, name: true } },
        roomType: { select: { id: true, name: true } },
        payments: { select: { id: true, provider: true, status: true, amount: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortDir },
    }),
    prisma.reservation.count({ where }),
  ]);

  return ok({ reservations, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});
