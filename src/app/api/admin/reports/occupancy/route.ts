import { NextRequest } from "next/server";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { requireSession } from "@/lib/services/auth";
import { getOccupancyReport } from "@/lib/services/reports";

/** GET /api/admin/reports/occupancy?startDate=&endDate= */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireSession("STAFF");
  const url = new URL(req.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (!startDate || !endDate) return err("startDate and endDate are required", 400);

  const report = await getOccupancyReport(startDate, endDate);
  return ok(report);
});
