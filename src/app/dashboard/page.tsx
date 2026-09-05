import Link from "next/link";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Crown, Wallet } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getDashboardStats } from "@/services/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CategoryPieCard, MonthlyTrendCard, WeeklyBarCard } from "@/modules/dashboard/components/charts";
import { AddExpenseHeaderButton } from "@/modules/dashboard/components/add-expense-header-button";
import { BudgetMonthCard } from "@/modules/dashboard/components/budget-month-card";
import { DashboardTabs } from "@/modules/dashboard/components/dashboard-tabs";
import { getCategoryMeta } from "@/utils/categories";
import { cn } from "@/lib/utils";
import { formatInr } from "@/utils/currency";

function StatCard({
  title,
  value,
  subtitle,
  icon,
  className,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("transition-transform hover:-translate-y-0.5 hover:shadow-md", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="break-words text-lg font-semibold tracking-tight sm:text-xl">{value}</p>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <span className="shrink-0 rounded-[var(--radius)] border border-border bg-accent/60 p-2 text-muted-foreground">
          {icon}
        </span>
      </CardHeader>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user.sub);
  const highestMeta = stats.highestCategory ? getCategoryMeta(stats.highestCategory.category) : null;
  const currentMonth = format(new Date(), "yyyy-MM");

  const overview = (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total today"
          value={formatInr(stats.todayTotal)}
          subtitle="Today’s spending"
          icon={<CalendarDays className="h-5 w-5" />}
          className="border-sky-200/70 bg-gradient-to-br from-sky-50 via-background to-cyan-50/60 dark:border-border dark:from-background dark:to-background"
        />
        <StatCard
          title="Weekly expenses"
          value={formatInr(stats.weekTotal)}
          subtitle="Last 7 days"
          icon={<ArrowUpRight className="h-5 w-5" />}
          className="border-violet-200/70 bg-gradient-to-br from-violet-50 via-background to-indigo-50/60 dark:border-border dark:from-background dark:to-background"
        />
        <StatCard
          title="Monthly expenses"
          value={formatInr(stats.monthTotal)}
          subtitle="This month"
          icon={<ArrowDownRight className="h-5 w-5" />}
          className="border-amber-200/70 bg-gradient-to-br from-amber-50 via-background to-orange-50/60 dark:border-border dark:from-background dark:to-background"
        />
        <Card className="border-fuchsia-200/70 bg-gradient-to-br from-fuchsia-50 via-background to-pink-50/60 transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-border dark:from-background dark:to-background">
          <CardHeader className="flex-row items-start justify-between gap-3 p-4 sm:p-5">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Top category</p>
              <p className="break-words text-lg font-semibold tracking-tight sm:text-xl">
                {stats.highestCategory ? highestMeta?.label ?? stats.highestCategory.category : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.highestCategory ? formatInr(stats.highestCategory.amount) : "No spend yet"}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-[var(--radius)] border border-border bg-accent/60 p-2",
                highestMeta?.colorClass,
              )}
            >
              <Crown className="h-5 w-5" />
            </span>
          </CardHeader>
        </Card>
        <StatCard
          title="Remaining balance"
          value={formatInr(stats.remainingBalance)}
          subtitle="Income − expenses (this month)"
          icon={<Wallet className="h-5 w-5" />}
          className="border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-background to-teal-50/60 dark:border-border dark:from-background dark:to-background"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <CategoryPieCard data={stats.categoryPie} />
          <WeeklyBarCard data={stats.weeklyBars} />
          <MonthlyTrendCard data={stats.monthlyTrend} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <BudgetMonthCard
          initialMonth={currentMonth}
          initialBudgetAmount={stats.budgetMonthAmount}
          initialExpensesTotal={stats.monthTotal}
          initialRemaining={stats.budgetRemaining}
          initialProgressPct={stats.budgetProgressPct}
        />

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 p-4 sm:p-5">
            <CardTitle>Recent expenses</CardTitle>
            <Button asChild variant="ghost" className="h-8 px-2 text-xs">
              <Link href="/dashboard/expenses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
            {stats.recentExpenses.length === 0 ? (
              <div className="rounded-[var(--radius)] border border-dashed border-border p-4 text-center">
                <p className="text-sm font-medium">Nothing yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add an expense to populate your dashboard.
                </p>
              </div>
            ) : (
              stats.recentExpenses.map((x) => {
                const meta = getCategoryMeta(x.category);
                return (
                  <div key={x.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{x.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge className={cn("border", meta.badgeClass)} variant="outline">
                          {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(x.date), "MMM d")}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-semibold tabular-nums">{formatInr(x.amount)}</div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-6 sm:pt-6">
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-gradient-to-br from-primary/15 via-background to-background p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">{user.name}</h1>
            <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMM d")}</p>
          </div>
          <div className="flex flex-col gap-2 min-[420px]:flex-row sm:shrink-0">
            <AddExpenseHeaderButton />
            <Button asChild variant="outline" className="w-full min-[420px]:w-auto">
              <Link href="/dashboard/expenses">Manage expenses</Link>
            </Button>
          </div>
        </div>
      </div>

      <DashboardTabs overview={overview} />
    </div>
  );
}
