import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "NOT_SET";
  // Mask the password
  const masked = dbUrl.replace(/:([^@]+)@/, ":***@");

  // Try a direct neon fetch
  let dbTest = "not tested";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(dbUrl);
    const result = await sql`SELECT count(*) as cnt FROM hotels`;
    dbTest = `OK: ${JSON.stringify(result)}`;
  } catch (e: unknown) {
    dbTest = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    DATABASE_URL: masked,
    NODE_ENV: process.env.NODE_ENV,
    dbTest,
  });
}
