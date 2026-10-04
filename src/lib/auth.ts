import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const COOKIE = "nx_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export type Role = "VIEWER" | "ADMIN";
export type Session = { userId: string; name: string; role: Role };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET trong .env phải dài tối thiểu 32 ký tự");
  return new TextEncoder().encode(value);
}

export async function createSession(user: { id: string; name: string; role: string }) {
  const token = await new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return {
      userId: payload.sub,
      name: String(payload.name ?? ""),
      role: payload.role === "ADMIN" ? "ADMIN" : "VIEWER",
    };
  } catch {
    return null;
  }
}

/** Quyền admin luôn được kiểm tra lại trong DB, không chỉ tin vào token. */
export async function getAdminSession() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  return user?.role === "ADMIN" ? session : null;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  const admin = await getAdminSession();
  if (!admin) redirect("/");
  return admin;
}

/** Chỉ cho phép chuyển hướng nội bộ để tránh open redirect. */
export function safeNext(value: unknown) {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}
