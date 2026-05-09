"use server";

import bcrypt from "bcryptjs";

import { connectToDb } from "@/lib/db";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth";
import { User } from "@/models/user";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/validations/auth";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function signupAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await connectToDb();

  const existing = await User.findOne({ email: parsed.data.email }).lean();
  if (existing) return { ok: false, error: "Email is already registered" };

  const password = await bcrypt.hash(parsed.data.password, 10);
  const user = await User.create({ ...parsed.data, password });

  await createSessionCookie({ sub: String(user._id), email: user.email, name: user.name });
  return { ok: true };
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await connectToDb();

  const user = await User.findOne({ email: parsed.data.email });
  if (!user) return { ok: false, error: "Invalid email or password" };

  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) return { ok: false, error: "Invalid email or password" };

  await createSessionCookie({ sub: String(user._id), email: user.email, name: user.name });
  return { ok: true };
}

export async function logoutAction(): Promise<ActionResult> {
  await clearSessionCookie();
  return { ok: true };
}

