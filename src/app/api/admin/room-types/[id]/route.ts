import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { updateRoomTypeSchema } from "@/lib/validators";
import { requireSession, auditLog } from "@/lib/services/auth";

/** PATCH /api/admin/room-types/:id */
export const PATCH = withErrorHandler(async (req: NextRequest, ctx) => {
  const session = await requireSession("ADMIN");
  const { id } = await ctx.params;
  const body = await req.json();
  const data = updateRoomTypeSchema.parse(body);

  const before = await prisma.roomType.findUnique({ where: { id } });
  if (!before) return err("Room type not found", 404);

  const roomType = await prisma.roomType.update({ where: { id }, data });
  await auditLog(session.userId, "roomType.update", "RoomType", id, before, roomType);
  return ok(roomType);
});

/** DELETE /api/admin/room-types/:id */
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const session = await requireSession("SUPER_ADMIN");
  const { id } = await ctx.params;

  const before = await prisma.roomType.findUnique({ where: { id } });
  if (!before) return err("Room type not found", 404);

  await prisma.roomType.delete({ where: { id } });
  await auditLog(session.userId, "roomType.delete", "RoomType", id, before, null);
  return ok({ deleted: true });
});
