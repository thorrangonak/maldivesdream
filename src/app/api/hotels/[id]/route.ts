import prisma from "@/lib/db/client";
import { ok, err, withErrorHandler } from "@/lib/api-utils";

/** GET /api/hotels/:id — hotel detail with rooms, photos, pricing seasons */
export const GET = withErrorHandler(async (_req, ctx) => {
  const { id } = await ctx.params;

  const hotel = await prisma.hotel.findFirst({
    where: { OR: [{ id }, { slug: id }], status: "ACTIVE" },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      roomTypes: {
        where: { active: true },
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
          seasonalPrices: {
            where: { active: true },
            include: { season: { select: { id: true, name: true, startDate: true, endDate: true } } },
            orderBy: { nightlyPrice: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!hotel) return err("Hotel not found", 404);
  return ok(hotel);
});
