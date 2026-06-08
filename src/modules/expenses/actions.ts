"use server";

import { revalidatePath } from "next/cache";

import { connectToDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Expense } from "@/models/expense";
import { expenseSchema, type ExpenseInput } from "@/validations/expense";
import { Types } from "mongoose";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export type ExpenseListItem = {
  id: string;
  title: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
  createdAt: string;
};

type ExpenseLean = {
  _id: Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  notes?: string;
  date: Date;
  createdAt: Date;
};

function toItem(doc: ExpenseLean): ExpenseListItem {
  return {
    id: String(doc._id),
    title: doc.title,
    amount: doc.amount,
    category: doc.category,
    notes: doc.notes || "",
    date: new Date(doc.date).toISOString(),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export type ExpenseListResult = {
  items: ExpenseListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listExpensesAction(params?: {
  q?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<ExpenseListResult>> {
  const user = await requireUser();
  await connectToDb();

  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params?.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const query: {
    userId: string;
    title?: { $regex: string; $options: string };
    category?: string;
    date?: { $gte?: Date; $lte?: Date };
  } = { userId: user.sub };

  if (params?.q) {
    query.title = { $regex: params.q, $options: "i" };
  }
  if (params?.category && params.category !== "all") {
    query.category = params.category;
  }
  if (params?.from || params?.to) {
    query.date = {};
    if (params.from) query.date.$gte = new Date(params.from);
    if (params.to) query.date.$lte = new Date(params.to);
  }

  const [total, docs] = await Promise.all([
    Expense.countDocuments(query),
    Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<ExpenseLean[]>(),
  ]);

  return {
    ok: true,
    data: {
      items: docs.map(toItem),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function createExpenseAction(input: ExpenseInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await connectToDb();
  await Expense.create({ ...parsed.data, userId: user.sub });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return { ok: true };
}

export async function updateExpenseAction(
  id: string,
  input: ExpenseInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await connectToDb();
  const updated = await Expense.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { $set: parsed.data },
    { new: true },
  );
  if (!updated) return { ok: false, error: "Expense not found" };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return { ok: true };
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await connectToDb();
  const res = await Expense.deleteOne({ _id: id, userId: user.sub });
  if (res.deletedCount !== 1) return { ok: false, error: "Expense not found" };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return { ok: true };
}

