"use client";

import * as React from "react";
import Link from "next/link";
import { endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { listExpensesAction, type ExpenseListItem } from "@/modules/expenses/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryMeta } from "@/utils/categories";
import { cn } from "@/lib/utils";
import { formatInr } from "@/utils/currency";

const PAGE_SIZE = 10;

function buildMonthOptions(count = 12) {
  const now = new Date();
  return Array.from({ length: count }).map((_, i) => {
    const d = subMonths(now, i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });
}

function monthRange(month: string) {
  const date = parse(month, "yyyy-MM", new Date());
  return {
    from: format(startOfMonth(date), "yyyy-MM-dd"),
    to: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

export function DashboardHistory() {
  const monthOptions = React.useMemo(() => buildMonthOptions(), []);
  const [month, setMonth] = React.useState(() => format(new Date(), "yyyy-MM"));
  const [items, setItems] = React.useState<ExpenseListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    setPage(1);
  }, [month]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { from, to } = monthRange(month);
    const res = await listExpensesAction({ page, pageSize: PAGE_SIZE, from, to });
    if (!res.ok) toast.error(res.error);
    if (res.ok && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [page, month]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const selectedLabel =
    monthOptions.find((m) => m.value === month)?.label ?? format(new Date(), "MMMM yyyy");

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Expense history</CardTitle>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Select month"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <Button asChild variant="ghost" className="h-8 px-2 text-xs">
            <Link href="/dashboard/expenses">Manage all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No expenses recorded for {selectedLabel}.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {total} expenses in {selectedLabel}
            </p>
            {items.map((x) => {
              const meta = getCategoryMeta(x.category);
              return (
                <div key={x.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{x.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className={cn("border", meta.badgeClass)} variant="outline">
                        {meta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(x.date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums">{formatInr(x.amount)}</div>
                </div>
              );
            })}

            {totalPages > 1 ? (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
