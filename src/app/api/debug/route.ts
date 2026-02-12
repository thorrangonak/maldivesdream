import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "NOT_SET";
  const masked = dbUrl.replace(/:([^@]+)@/, ":***@");

  // Show URL details for debugging
  const urlLen = dbUrl.length;
  const lastChars = JSON.stringify(dbUrl.slice(-20));
  const hasNewline = dbUrl.includes("\n");

  // Test direct fetch with hardcoded URL to eliminate env var issues
  let hardcodedTest = "not tested";
  try {
    const hardcodedUrl = "https://ep-spring-salad-ai4eli7q-pooler.c-4.us-east-1.aws.neon.tech/sql";
    const resp = await fetch(hardcodedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Neon-Connection-String": "postgresql://neondb_owner:npg_Jkb09QfhHniG@ep-spring-salad-ai4eli7q-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",
      },
      body: JSON.stringify({ query: "SELECT count(*) as cnt FROM hotels" }),
    });
    const body = await resp.text();
    hardcodedTest = `HTTP ${resp.status}: ${body.substring(0, 200)}`;
  } catch (e: unknown) {
    hardcodedTest = `FAIL: ${e instanceof Error ? `${e.message} | cause: ${JSON.stringify((e as NodeJS.ErrnoException).cause)}` : String(e)}`;
  }

  // Test with env var
  let envTest = "not tested";
  try {
    const url = new URL(dbUrl.trim());
    const httpUrl = `https://${url.hostname}/sql`;
    const resp = await fetch(httpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Neon-Connection-String": dbUrl.trim(),
      },
      body: JSON.stringify({ query: "SELECT 1" }),
    });
    const body = await resp.text();
    envTest = `HTTP ${resp.status} (host: ${url.hostname}): ${body.substring(0, 100)}`;
  } catch (e: unknown) {
    envTest = `FAIL: ${e instanceof Error ? `${e.message} | cause: ${JSON.stringify((e as NodeJS.ErrnoException).cause)}` : String(e)}`;
  }

  return NextResponse.json({
    DATABASE_URL: masked,
    urlLen,
    lastChars,
    hasNewline,
    hardcodedTest,
    envTest,
  });
}
