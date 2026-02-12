import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { paginationSchema } from "@/lib/validators";

/** GET /api/hotels — list active hotels with filters */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const { page, pageSize } = paginationSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const atoll = url.searchParams.get("atoll") || undefined;
  const island = url.searchParams.get("island") || undefined;
  const minRating = url.searchParams.get("minRating");
  const search = url.searchParams.get("search") || undefined;

  const where = {
    status: "ACTIVE" as const,
    ...(atoll && { atoll: { contains: atoll, mode: "insensitive" as const } }),
    ...(island && { island: { contains: island, mode: "insensitive" as const } }),
    ...(minRating && { starRating: { gte: parseInt(minRating) } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { island: { contains: search, mode: "insensitive" as const } },
        { atoll: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      include: {
        photos: { where: { roomTypeId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
        roomTypes: { where: { active: true }, select: { id: true, name: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.hotel.count({ where }),
  ]);

  return ok({
    hotels,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});
