"use server";

import { revalidatePath } from "next/cache";

import { connectToDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Budget } from "@/models/budget";
import { budgetSchema, type BudgetInput } from "@/validations/budget";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function getBudgetAction(month: string): Promise<ActionResult<{ amount: number | null }>> {
  const user = await requireUser();
  await connectToDb();
  const doc = await Budget.findOne({ userId: user.sub, month }).lean();
  return { ok: true, data: { amount: doc ? Number(doc.amount) : null } };
}

export async function setBudgetAction(input: BudgetInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await connectToDb();
  await Budget.findOneAndUpdate(
    { userId: user.sub, month: parsed.data.month },
    { $set: { amount: parsed.data.amount } },
    { upsert: true, new: true },
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budget");
  return { ok: true };
}

