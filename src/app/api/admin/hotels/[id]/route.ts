import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { updateHotelSchema } from "@/lib/validators";
import { requireSession, auditLog } from "@/lib/services/auth";

/** GET /api/admin/hotels/:id */
export const GET = withErrorHandler(async (_req, ctx) => {
  await requireSession("STAFF");
  const { id } = await ctx.params;
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      roomTypes: { include: { _count: { select: { reservations: true } } } },
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!hotel) return err("Hotel not found", 404);
  return ok(hotel);
});

/** PATCH /api/admin/hotels/:id */
export const PATCH = withErrorHandler(async (req: NextRequest, ctx) => {
  const session = await requireSession("ADMIN");
  const { id } = await ctx.params;
  const body = await req.json();
  const data = updateHotelSchema.parse(body);

  const before = await prisma.hotel.findUnique({ where: { id } });
  if (!before) return err("Hotel not found", 404);

  const { policies, amenities, ...rest } = data;
  const hotel = await prisma.hotel.update({
    where: { id },
    data: {
      ...rest,
      ...(amenities !== undefined && { amenities }),
      ...(policies !== undefined && { policies: policies as object }),
    },
  });
  await auditLog(session.userId, "hotel.update", "Hotel", id, before, hotel);
  return ok(hotel);
});

/** DELETE /api/admin/hotels/:id */
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const session = await requireSession("SUPER_ADMIN");
  const { id } = await ctx.params;

  const before = await prisma.hotel.findUnique({ where: { id } });
  if (!before) return err("Hotel not found", 404);

  await prisma.hotel.delete({ where: { id } });
  await auditLog(session.userId, "hotel.delete", "Hotel", id, before, null);
  return ok({ deleted: true });
});
