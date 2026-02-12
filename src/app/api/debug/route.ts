import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "NOT_SET";
  const masked = dbUrl.replace(/:([^@]+)@/, ":***@");

  // Test 1: Direct fetch to Neon HTTP endpoint
  let fetchTest = "not tested";
  try {
    const url = new URL(dbUrl);
    const httpUrl = `https://${url.hostname}/sql`;
    const resp = await fetch(httpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Neon-Connection-String": dbUrl,
      },
      body: JSON.stringify({ query: "SELECT 1 as test" }),
    });
    const body = await resp.text();
    fetchTest = `HTTP ${resp.status}: ${body.substring(0, 200)}`;
  } catch (e: unknown) {
    fetchTest = `FAIL: ${e instanceof Error ? `${e.message} | cause: ${JSON.stringify((e as NodeJS.ErrnoException).cause)}` : String(e)}`;
  }

  // Test 2: neon() function
  let neonTest = "not tested";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(dbUrl);
    const result = await sql`SELECT count(*) as cnt FROM hotels`;
    neonTest = `OK: ${JSON.stringify(result)}`;
  } catch (e: unknown) {
    neonTest = `FAIL: ${e instanceof Error ? `${e.message} | cause: ${JSON.stringify((e as NodeJS.ErrnoException).cause)}` : String(e)}`;
  }

  return NextResponse.json({
    DATABASE_URL: masked,
    NODE_ENV: process.env.NODE_ENV,
    nodeVersion: process.version,
    fetchTest,
    neonTest,
  });
}
