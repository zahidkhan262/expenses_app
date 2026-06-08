"use server";

import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { connectToDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Budget } from "@/models/budget";
import { Expense } from "@/models/expense";
import { budgetSchema, type BudgetInput } from "@/validations/budget";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function getBudgetAction(month: string): Promise<ActionResult<{ amount: number | null }>> {
  const user = await requireUser();
  await connectToDb();
  const doc = await Budget.findOne({ userId: user.sub, month }).lean();
  return { ok: true, data: { amount: doc ? Number(doc.amount) : null } };
}

export type MonthBudgetStats = {
  month: string;
  monthLabel: string;
  budgetAmount: number | null;
  expensesTotal: number;
  remaining: number | null;
  progressPct: number | null;
};

export async function getMonthBudgetStatsAction(
  month: string,
): Promise<ActionResult<MonthBudgetStats>> {
  const user = await requireUser();
  const parsed = budgetSchema.shape.month.safeParse(month);
  if (!parsed.success) return { ok: false, error: "Invalid month format" };

  await connectToDb();
  const monthDate = parse(parsed.data, "yyyy-MM", new Date());
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const oid = new Types.ObjectId(user.sub);

  const [budget, expenseAgg] = await Promise.all([
    Budget.findOne({ userId: user.sub, month: parsed.data }).lean(),
    Expense.aggregate([
      { $match: { userId: oid, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const budgetAmount = budget ? Number(budget.amount) : null;
  const expensesTotal = Number(expenseAgg[0]?.total ?? 0);
  const remaining =
    budgetAmount != null ? Math.max(0, budgetAmount - expensesTotal) : null;
  const progressPct =
    budgetAmount != null && budgetAmount > 0
      ? Math.min(100, (expensesTotal / budgetAmount) * 100)
      : null;

  return {
    ok: true,
    data: {
      month: parsed.data,
      monthLabel: format(monthDate, "MMMM yyyy"),
      budgetAmount,
      expensesTotal,
      remaining,
      progressPct,
    },
  };
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

