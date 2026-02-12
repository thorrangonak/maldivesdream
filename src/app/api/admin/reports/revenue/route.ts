import { NextRequest } from "next/server";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { requireSession } from "@/lib/services/auth";
import { getRevenueReport } from "@/lib/services/reports";

/** GET /api/admin/reports/revenue?startDate=&endDate= */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireSession("STAFF");
  const url = new URL(req.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (!startDate || !endDate) return err("startDate and endDate are required", 400);

  const report = await getRevenueReport(startDate, endDate);
  return ok(report);
});
