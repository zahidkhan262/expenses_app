import "server-only";

import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { Types } from "mongoose";

import { connectToDb } from "@/lib/db";
import { Expense } from "@/models/expense";
import { Income } from "@/models/income";
import { Budget } from "@/models/budget";

type BucketAgg = { _id: string; total: number };
type RecentExpenseLean = {
  _id: Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  date: Date;
};

export type DashboardStats = {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  highestCategory: { category: string; amount: number } | null;
  incomeMonthTotal: number;
  remainingBalance: number;
  budgetMonthAmount: number | null;
  budgetRemaining: number | null;
  budgetProgressPct: number | null;
  categoryPie: { name: string; value: number }[];
  weeklyBars: { day: string; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
  recentExpenses: {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
  }[];
};

export async function getDashboardStats(
  userId: string,
  now = new Date(),
): Promise<DashboardStats> {
  await connectToDb();
  const oid = new Types.ObjectId(userId);

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [todayAgg] = await Expense.aggregate([
    { $match: { userId: oid, date: { $gte: todayStart, $lte: todayEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const [weekAgg] = await Expense.aggregate([
    { $match: { userId: oid, date: { $gte: weekStart, $lte: todayEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const [monthAgg] = await Expense.aggregate([
    { $match: { userId: oid, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const categoryAgg = await Expense.aggregate<BucketAgg>([
    { $match: { userId: oid, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const [incomeMonthAgg] = await Income.aggregate([
    { $match: { userId: oid, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const monthKey = format(now, "yyyy-MM");
  const budget = await Budget.findOne({ userId, month: monthKey }).lean();

  const recent = await Expense.find({ userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(8)
    .lean<RecentExpenseLean[]>();

  const last7 = Array.from({ length: 7 }).map((_, idx) =>
    subDays(now, 6 - idx),
  );
  const barsAgg = await Expense.aggregate<BucketAgg>([
    {
      $match: {
        userId: oid,
        date: { $gte: startOfDay(subDays(now, 6)), $lte: todayEnd },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        total: { $sum: "$amount" },
      },
    },
  ]);
  const barsMap = new Map<string, number>(barsAgg.map((x) => [x._id, x.total]));

  const last6Months = Array.from({ length: 6 }).map((_, i) =>
    subMonths(startOfMonth(now), 5 - i),
  );
  const trendAgg = await Expense.aggregate<BucketAgg>([
    {
      $match: {
        userId: oid,
        date: { $gte: startOfMonth(subMonths(now, 5)), $lte: monthEnd },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        total: { $sum: "$amount" },
      },
    },
  ]);
  const trendMap = new Map<string, number>(trendAgg.map((x) => [x._id, x.total]));

  const monthTotal = Number(monthAgg?.total ?? 0);
  const incomeMonthTotal = Number(incomeMonthAgg?.total ?? 0);
  const remainingBalance = incomeMonthTotal - monthTotal;

  const budgetMonthAmount = budget ? Number(budget.amount) : null;
  const budgetRemaining =
    budgetMonthAmount != null
      ? Math.max(0, budgetMonthAmount - monthTotal)
      : null;
  const budgetProgressPct =
    budgetMonthAmount != null && budgetMonthAmount > 0
      ? Math.min(100, (monthTotal / budgetMonthAmount) * 100)
      : null;

  return {
    todayTotal: Number(todayAgg?.total ?? 0),
    weekTotal: Number(weekAgg?.total ?? 0),
    monthTotal,
    highestCategory: categoryAgg.length
      ? {
          category: String(categoryAgg[0]._id),
          amount: Number(categoryAgg[0].total),
        }
      : null,
    incomeMonthTotal,
    remainingBalance,
    budgetMonthAmount,
    budgetRemaining,
    budgetProgressPct,
    categoryPie: categoryAgg.map((x) => ({
      name: String(x._id),
      value: Number(x.total),
    })),
    weeklyBars: last7.map((d) => ({
      day: format(d, "EEE"),
      amount: Number(barsMap.get(format(d, "yyyy-MM-dd")) ?? 0),
    })),
    monthlyTrend: last6Months.map((d) => ({
      month: format(d, "MMM"),
      amount: Number(trendMap.get(format(d, "yyyy-MM")) ?? 0),
    })),
    recentExpenses: recent.map((x) => ({
      id: String(x._id),
      title: x.title,
      amount: Number(x.amount),
      category: x.category,
      date: new Date(x.date).toISOString(),
    })),
  };
}
