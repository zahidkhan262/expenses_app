"use client";

import * as React from "react";
import { format } from "date-fns";
import { Download, Filter, Plus, Search, Trash2, Pencil, Info } from "lucide-react";
import { toast } from "sonner";

import {
  deleteExpenseAction,
  listExpensesAction,
  type ExpenseListItem,
} from "@/modules/expenses/actions";
import { CATEGORIES, getCategoryMeta } from "@/utils/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ExpenseFormDialog } from "@/modules/expenses/components/expense-form-dialog";
import { cn } from "@/lib/utils";
import { formatInr } from "@/utils/currency";

function exportCsv(items: ExpenseListItem[]) {
  const header = ["Title", "Amount", "Category", "Notes", "Date"].join(",");
  const rows = items.map((x) =>
    [
      x.title,
      String(x.amount),
      x.category,
      (x.notes ?? "").replaceAll("\n", " "),
      format(new Date(x.date), "yyyy-MM-dd"),
    ]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExpensesClient() {
  const [items, setItems] = React.useState<ExpenseListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [tipsOpen, setTipsOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(q.trim());
    }, 500);
    return () => window.clearTimeout(timer);
  }, [q]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const res = await listExpensesAction({
      q: debouncedQ,
      category,
      from: from || undefined,
      to: to || undefined,
    });
    if (!res.ok) toast.error(res.error);
    setItems(res.ok ? res.data ?? [] : []);
    setLoading(false);
  }, [debouncedQ, category, from, to]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const total = React.useMemo(() => items.reduce((sum, x) => sum + x.amount, 0), [items]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Search, filter, and manage your daily spending.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportCsv(items)}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <ExpenseFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add expense
              </Button>
            }
            onSaved={refresh}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="md:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>All expenses</CardTitle>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Expense tips"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onMouseEnter={() => setTipsOpen(true)}
                  onMouseLeave={() => setTipsOpen(false)}
                  onFocus={() => setTipsOpen(true)}
                  onBlur={() => setTipsOpen(false)}
                  onClick={() => setTipsOpen((prev) => !prev)}
                >
                  <Info className="h-4 w-4" />
                </button>
                {tipsOpen ? (
                  <div
                    className="absolute left-0 top-9 z-20 w-72 rounded-[var(--radius)] border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg"
                    onMouseEnter={() => setTipsOpen(true)}
                    onMouseLeave={() => setTipsOpen(false)}
                  >
                    <p>Use categories to get clean analytics in your dashboard.</p>
                    <p className="mt-2">
                      Export to CSV anytime for backups or reporting.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{formatInr(total)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title..."
                  className="pl-9"
                />
              </div>
              <div className="relative sm:w-56">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full appearance-none rounded-[var(--radius)] border border-input bg-background px-9 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:w-[18rem]">
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-label="From date"
                />
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label="To date"
                />
              </div>
            </div>

            <Separator />

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[var(--radius)] border border-dashed border-border p-6 text-center">
                <p className="text-sm font-medium">No expenses yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first expense to see analytics and trends.
                </p>
                <div className="mt-4 flex justify-center">
                  <ExpenseFormDialog
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4" />
                        Add expense
                      </Button>
                    }
                    onSaved={refresh}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((x) => {
                  const meta = getCategoryMeta(x.category);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={x.id}
                      className="group flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-background p-4 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 capitalize">
                          <span className={cn("rounded-md bg-accent/60 p-1.5", meta.colorClass)}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <p className="truncate text-sm font-semibold">{x.title}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 capitalize text-xs text-muted-foreground">
                          <Badge className={cn("border", meta.badgeClass)} variant="outline">
                            {meta.label}
                          </Badge>
                          <span>{format(new Date(x.date), "MMM d, yyyy")}</span>
                          {x.notes ? <span className="truncate">• {x.notes}</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <p className="text-sm font-semibold tabular-nums">{formatInr(x.amount)}</p>
                        <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <ExpenseFormDialog
                            expense={x}
                            trigger={
                              <Button size="icon" variant="ghost" aria-label="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                            onSaved={refresh}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Delete"
                            onClick={async () => {
                              const ok = confirm("Delete this expense?");
                              if (!ok) return;
                              const res = await deleteExpenseAction(x.id);
                              if (!res.ok) toast.error(res.error);
                              else toast.success("Expense deleted");
                              void refresh();
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <ExpenseFormDialog
          trigger={
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <Plus className="h-5 w-5" />
            </Button>
          }
          onSaved={refresh}
        />
      </div>
    </div>
  );
}

