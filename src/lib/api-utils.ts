import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/utils/logger";

/** Standard JSON success response */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Standard JSON error response */
export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>;

/** Wrap a route handler with error catching */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ZodError) {
        return err(error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "), 400);
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      if (message === "Unauthorized") return err(message, 401);
      if (message.startsWith("Forbidden")) return err(message, 403);
      logger.error("Unhandled API error", { error: message, path: req.url });
      return err(message, 500);
    }
  };
}
