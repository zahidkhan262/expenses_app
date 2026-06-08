"use client";

import * as React from "react";
import Link from "next/link";
import { format, subMonths } from "date-fns";
import { toast } from "sonner";

import { getMonthBudgetStatsAction, type MonthBudgetStats } from "@/modules/budget/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInr } from "@/utils/currency";

function buildMonthOptions(count = 12) {
  const now = new Date();
  return Array.from({ length: count }).map((_, i) => {
    const d = subMonths(now, i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });
}

export function BudgetMonthCard({
  initialMonth,
  initialBudgetAmount,
  initialExpensesTotal,
  initialRemaining,
  initialProgressPct,
}: {
  initialMonth: string;
  initialBudgetAmount: number | null;
  initialExpensesTotal: number;
  initialRemaining: number | null;
  initialProgressPct: number | null;
}) {
  const monthOptions = React.useMemo(() => buildMonthOptions(), []);
  const [month, setMonth] = React.useState(initialMonth);
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<MonthBudgetStats>({
    month: initialMonth,
    monthLabel: format(new Date(), "MMMM yyyy"),
    budgetAmount: initialBudgetAmount,
    expensesTotal: initialExpensesTotal,
    remaining: initialRemaining,
    progressPct: initialProgressPct,
  });

  const loadMonth = React.useCallback(async (value: string) => {
    setLoading(true);
    const res = await getMonthBudgetStatsAction(value);
    if (!res.ok) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    if (res.data) setStats(res.data);
    setLoading(false);
  }, []);

  const onMonthChange = (value: string) => {
    setMonth(value);
    void loadMonth(value);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Budget</CardTitle>
        <select
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="h-9 rounded-[var(--radius)] border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : stats.budgetAmount == null ? (
          <div className="rounded-[var(--radius)] border border-dashed border-border p-4">
            <p className="text-sm font-medium">No budget for {stats.monthLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Expenses this month: {formatInr(stats.expensesTotal)}
            </p>
            <div className="mt-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/budget">Set budget</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-sm text-muted-foreground">Monthly budget</div>
              <div className="text-sm font-semibold tabular-nums">
                {formatInr(stats.budgetAmount)}
              </div>
            </div>
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>Expenses ({stats.monthLabel})</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatInr(stats.expensesTotal)}
              </span>
            </div>
            <Progress value={stats.progressPct ?? 0} />
            <div className="flex items-baseline justify-between">
              <div className="text-xs text-muted-foreground">Remaining</div>
              <div className="text-xs font-medium tabular-nums">
                {formatInr(Number(stats.remaining ?? 0))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
