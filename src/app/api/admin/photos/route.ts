import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { requireSession } from "@/lib/services/auth";
import { createPresignedUpload, deleteObject } from "@/lib/services/storage";
import { z } from "zod";

const uploadRequestSchema = z.object({
  hotelId: z.string().optional(),
  roomTypeId: z.string().optional(),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
  altText: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

/** POST /api/admin/photos — get presigned upload URL and create photo record */
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireSession("ADMIN");
  const body = await req.json();
  const data = uploadRequestSchema.parse(body);

  if (!data.hotelId && !data.roomTypeId) {
    return err("Either hotelId or roomTypeId is required", 400);
  }

  const folder = data.roomTypeId ? `rooms/${data.roomTypeId}` : `hotels/${data.hotelId}`;
  const { uploadUrl, key, publicUrl } = await createPresignedUpload(
    folder,
    data.filename,
    data.mimeType,
    data.sizeBytes
  );

  // Create photo record (URL is the public URL)
  const photo = await prisma.photo.create({
    data: {
      hotelId: data.hotelId,
      roomTypeId: data.roomTypeId,
      url: publicUrl,
      key,
      altText: data.altText,
      sortOrder: data.sortOrder,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    },
  });

  return ok({ photo, uploadUrl }, 201);
});

/** DELETE /api/admin/photos?id= */
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireSession("ADMIN");
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return err("id is required", 400);

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return err("Photo not found", 404);

  await deleteObject(photo.key);
  await prisma.photo.delete({ where: { id } });

  return ok({ deleted: true });
});
