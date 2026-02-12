import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/client";
import type { UserRole } from "@prisma/client";
import { logger } from "@/lib/utils/logger";

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret-change-me");
const TOKEN_NAME = "md-admin-token";
const TOKEN_MAX_AGE = 8 * 60 * 60; // 8 hours

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Hash a password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Verify a password */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a signed JWT token */
async function createToken(payload: AdminSession): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

/** Verify and decode a JWT token */
async function verifyToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

/** Login: validate credentials and set cookie */
export async function login(email: string, password: string): Promise<AdminSession> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) throw new Error("Invalid credentials");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  const session: AdminSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = await createToken(session);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE,
    path: "/",
  });

  logger.info("Admin login", { userId: user.id, email });
  return session;
}

/** Logout: clear cookie */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

/** Get current admin session from cookie */
export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Require an admin session; throw if not authenticated */
export async function requireSession(minRole?: UserRole): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (minRole) {
    const hierarchy: UserRole[] = ["STAFF", "ADMIN", "SUPER_ADMIN"];
    const sessionLevel = hierarchy.indexOf(session.role);
    const requiredLevel = hierarchy.indexOf(minRole);
    if (sessionLevel < requiredLevel) throw new Error("Forbidden: insufficient role");
  }

  return session;
}

/** Create an audit log entry */
export async function auditLog(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
  ipAddress?: string
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      before: before ? (before as object) : undefined,
      after: after ? (after as object) : undefined,
      ipAddress,
    },
  });
}
