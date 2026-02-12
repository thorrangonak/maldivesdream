import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, withErrorHandler } from "@/lib/api-utils";
import { createRoomTypeSchema, paginationSchema } from "@/lib/validators";
import { requireSession, auditLog } from "@/lib/services/auth";
import slugify from "slugify";

/** GET /api/admin/room-types?hotelId= */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireSession("STAFF");
  const url = new URL(req.url);
  const hotelId = url.searchParams.get("hotelId") || undefined;
  const { page, pageSize } = paginationSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const where = hotelId ? { hotelId } : {};
  const [roomTypes, total] = await Promise.all([
    prisma.roomType.findMany({
      where,
      include: {
        hotel: { select: { id: true, name: true } },
        photos: { orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { seasonalPrices: true, reservations: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.roomType.count({ where }),
  ]);

  return ok({ roomTypes, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

/** POST /api/admin/room-types */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireSession("ADMIN");
  const body = await req.json();
  const data = createRoomTypeSchema.parse(body);

  const slug = slugify(data.name, { lower: true, strict: true });
  const roomType = await prisma.roomType.create({
    data: { ...data, slug, baseFeatures: data.baseFeatures },
  });

  await auditLog(session.userId, "roomType.create", "RoomType", roomType.id, null, roomType);
  return ok(roomType, 201);
});
