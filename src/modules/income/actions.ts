"use server";

import { revalidatePath } from "next/cache";

import { connectToDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Income } from "@/models/income";
import { incomeSchema, type IncomeInput } from "@/validations/income";
import { Types } from "mongoose";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export type IncomeListItem = {
  id: string;
  amount: number;
  source: string;
  date: string;
};

type IncomeLean = {
  _id: Types.ObjectId;
  amount: number;
  source: string;
  date: Date;
};

export async function listIncomeAction(): Promise<ActionResult<IncomeListItem[]>> {
  const user = await requireUser();
  await connectToDb();
  const docs = await Income.find({ userId: user.sub })
    .sort({ date: -1, createdAt: -1 })
    .limit(200)
    .lean<IncomeLean[]>();
  return {
    ok: true,
    data: docs.map((x) => ({
      id: String(x._id),
      amount: Number(x.amount),
      source: x.source,
      date: new Date(x.date).toISOString(),
    })),
  };
}

export async function addIncomeAction(input: IncomeInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = incomeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await connectToDb();
  await Income.create({ ...parsed.data, userId: user.sub });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
  return { ok: true };
}

