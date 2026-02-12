import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, withErrorHandler } from "@/lib/api-utils";
import { createHotelSchema, paginationSchema } from "@/lib/validators";
import { requireSession, auditLog } from "@/lib/services/auth";
import slugify from "slugify";

/** GET /api/admin/hotels — list all hotels (admin) */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireSession("STAFF");
  const url = new URL(req.url);
  const { page, pageSize } = paginationSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });
  const status = url.searchParams.get("status") || undefined;

  const where = status ? { status: status as "DRAFT" | "ACTIVE" | "INACTIVE" } : {};
  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      include: { _count: { select: { roomTypes: true, reservations: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.hotel.count({ where }),
  ]);

  return ok({ hotels, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

/** POST /api/admin/hotels — create hotel */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireSession("ADMIN");
  const body = await req.json();
  const data = createHotelSchema.parse(body);

  const slug = slugify(data.name, { lower: true, strict: true });
  const { policies, ...rest } = data;
  const hotel = await prisma.hotel.create({
    data: { ...rest, slug, policies: (policies || {}) as object },
  });

  await auditLog(session.userId, "hotel.create", "Hotel", hotel.id, null, hotel);
  return ok(hotel, 201);
});
