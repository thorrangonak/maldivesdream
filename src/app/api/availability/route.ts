import { NextRequest } from "next/server";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { availabilityQuerySchema } from "@/lib/validators";
import { checkAvailability, checkHotelAvailability } from "@/lib/services/availability";

/** GET /api/availability?hotelId=&roomTypeId=&checkIn=&checkOut=&guests=&qty= */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const params = availabilityQuerySchema.parse({
    hotelId: url.searchParams.get("hotelId"),
    roomTypeId: url.searchParams.get("roomTypeId") || undefined,
    checkIn: url.searchParams.get("checkIn"),
    checkOut: url.searchParams.get("checkOut"),
    guests: url.searchParams.get("guests"),
    qty: url.searchParams.get("qty"),
  });

  if (params.roomTypeId) {
    const result = await checkAvailability(
      params.hotelId,
      params.roomTypeId,
      params.checkIn,
      params.checkOut,
      params.guests,
      params.qty
    );
    return ok(result);
  }

  // Check all room types at hotel
  const results = await checkHotelAvailability(
    params.hotelId,
    params.checkIn,
    params.checkOut,
    params.guests,
    params.qty
  );

  return ok(results);
});
