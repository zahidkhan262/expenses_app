import "server-only";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "expenses_session";

type SessionPayload = {
  sub: string;
  email: string;
  name: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET env var");
  return secret;
}

export function createSessionCookie(payload: SessionPayload) {
  const token = jwt.sign(payload, getAuthSecret(), { expiresIn: "30d" });
  return cookies().then((store) =>
    store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    }),
  );
}

export function clearSessionCookie() {
  return cookies().then((store) =>
    store.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    }),
  );
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, getAuthSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export function isAdminEmail(email: string) {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!adminEmail) return false;
  return email.trim().toLowerCase() === adminEmail;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (!isAdminEmail(session.email)) redirect("/dashboard");
  return session;
}

