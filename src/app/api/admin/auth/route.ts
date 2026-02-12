import { NextRequest } from "next/server";
import { ok, err, withErrorHandler } from "@/lib/api-utils";
import { loginSchema } from "@/lib/validators";
import { login, logout, getSession } from "@/lib/services/auth";

/** POST /api/admin/auth — login */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { email, password } = loginSchema.parse(body);
  const session = await login(email, password);
  return ok(session);
});

/** DELETE /api/admin/auth — logout */
export const DELETE = withErrorHandler(async () => {
  await logout();
  return ok({ message: "Logged out" });
});

/** GET /api/admin/auth — get current session */
export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) return err("Not authenticated", 401);
  return ok(session);
});
