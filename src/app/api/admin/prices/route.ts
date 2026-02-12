import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, withErrorHandler } from "@/lib/api-utils";
import { createSeasonalPriceSchema, paginationSchema } from "@/lib/validators";
import { requireSession, auditLog } from "@/lib/services/auth";

/** GET /api/admin/prices?roomTypeId=&seasonId= */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireSession("STAFF");
  const url = new URL(req.url);
  const roomTypeId = url.searchParams.get("roomTypeId") || undefined;
  const seasonId = url.searchParams.get("seasonId") || undefined;
  const { page, pageSize } = paginationSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const where = {
    ...(roomTypeId && { roomTypeId }),
    ...(seasonId && { seasonId }),
  };

  const [prices, total] = await Promise.all([
    prisma.seasonalPrice.findMany({
      where,
      include: {
        roomType: { select: { id: true, name: true, hotel: { select: { id: true, name: true } } } },
        season: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.seasonalPrice.count({ where }),
  ]);

  return ok({ prices, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

/** POST /api/admin/prices */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireSession("ADMIN");
  const body = await req.json();
  const data = createSeasonalPriceSchema.parse(body);

  const price = await prisma.seasonalPrice.create({
    data: {
      roomTypeId: data.roomTypeId,
      seasonId: data.seasonId,
      nightlyPrice: data.nightlyPrice,
      currency: data.currency,
      minNights: data.minNights,
      promoRules: (data.promoRules || {}) as object,
    },
  });

  await auditLog(session.userId, "seasonalPrice.create", "SeasonalPrice", price.id, null, price);
  return ok(price, 201);
});
