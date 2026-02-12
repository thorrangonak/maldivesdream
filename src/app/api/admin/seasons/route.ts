import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { createSeasonSchema } from "@/lib/validators";
import { requireSession, auditLog } from "@/lib/services/auth";

/** GET /api/admin/seasons */
export const GET = withErrorHandler(async () => {
  await requireSession("STAFF");
  const seasons = await prisma.season.findMany({
    include: { _count: { select: { prices: true } } },
    orderBy: { startDate: "desc" },
  });
  return ok(seasons);
});

/** POST /api/admin/seasons */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireSession("ADMIN");
  const body = await req.json();
  const data = createSeasonSchema.parse(body);

  // Validate no overlapping active seasons
  const overlapping = await prisma.season.findFirst({
    where: {
      active: true,
      OR: [
        { startDate: { lte: new Date(data.endDate) }, endDate: { gte: new Date(data.startDate) } },
      ],
    },
  });

  if (overlapping) {
    return err(`Season overlaps with "${overlapping.name}" (${overlapping.startDate.toISOString().split("T")[0]} - ${overlapping.endDate.toISOString().split("T")[0]})`, 409);
  }

  const season = await prisma.season.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      active: data.active,
    },
  });

  await auditLog(session.userId, "season.create", "Season", season.id, null, season);
  return ok(season, 201);
});
