"use server";

import { Types } from "mongoose";

import { connectToDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { User } from "@/models/user";
import { Expense } from "@/models/expense";
import { Income } from "@/models/income";
import { Budget } from "@/models/budget";
import { Borrow } from "@/models/borrow";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  expenseCount: number;
  incomeCount: number;
  budgetCount: number;
  borrowCount: number;
  totalExpenses: number;
  totalIncome: number;
};

type UserLean = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  createdAt: Date;
};

export async function listUsersAction(): Promise<ActionResult<AdminUserItem[]>> {
  await requireAdmin();
  await connectToDb();

  const users = await User.find().sort({ createdAt: -1 }).lean<UserLean[]>();

  const items = await Promise.all(
    users.map(async (u) => {
      const userId = String(u._id);
      const oid = u._id;

      const [expenseCount, incomeCount, budgetCount, borrowCount, expenseAgg, incomeAgg] =
        await Promise.all([
          Expense.countDocuments({ userId }),
          Income.countDocuments({ userId }),
          Budget.countDocuments({ userId }),
          Borrow.countDocuments({ userId }),
          Expense.aggregate([
            { $match: { userId: oid } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Income.aggregate([
            { $match: { userId: oid } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
        ]);

      return {
        id: userId,
        name: u.name,
        email: u.email,
        createdAt: new Date(u.createdAt).toISOString(),
        expenseCount,
        incomeCount,
        budgetCount,
        borrowCount,
        totalExpenses: Number(expenseAgg[0]?.total ?? 0),
        totalIncome: Number(incomeAgg[0]?.total ?? 0),
      };
    }),
  );

  return { ok: true, data: items };
}
