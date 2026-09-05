"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Filter, Plus, Search, Trash2, Pencil, Info, X } from "lucide-react";
import { toast } from "sonner";

import {
  deleteExpenseAction,
  listExpensesAction,
  type ExpenseListItem,
} from "@/modules/expenses/actions";
import { CATEGORIES, getCategoryMeta } from "@/utils/categories";
import { buildYearOptions, buildMonthList, getWeeksForMonth, computeDateRange } from "@/utils/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ExpenseFormDialog } from "@/modules/expenses/components/expense-form-dialog";
import { cn } from "@/lib/utils";
import { formatInr } from "@/utils/currency";

const PAGE_SIZE = 20;

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

const now = new Date();
const INITIAL_YEAR = now.getFullYear().toString();
const INITIAL_MONTH = (now.getMonth() + 1).toString().padStart(2, "0");
const INITIAL_WEEKS = getWeeksForMonth(INITIAL_YEAR, INITIAL_MONTH);
const todayStr = format(now, "yyyy-MM-dd");
const INITIAL_WEEK = INITIAL_WEEKS.find(w => todayStr >= w.from && todayStr <= w.to)?.value || "all";

export function ExpensesClient() {
  const [items, setItems] = React.useState<ExpenseListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [year, setYear] = React.useState<string>(INITIAL_YEAR);
  const [month, setMonth] = React.useState<string>(INITIAL_MONTH);
  const [week, setWeek] = React.useState<string>(INITIAL_WEEK);
  const [filterOpen, setFilterOpen] = React.useState(false);
  
  const yearOptions = React.useMemo(() => buildYearOptions(5), []);
  const monthOptions = React.useMemo(() => buildMonthList(), []);
  const weekOptions = React.useMemo(() => getWeeksForMonth(year, month), [year, month]);
  
  const allWeekOptions = React.useMemo(() => {
    return [{ value: "all", label: "All Weeks in Month" }, ...weekOptions];
  }, [weekOptions]);
  
  const currentWeekIndex = React.useMemo(() => {
    const idx = allWeekOptions.findIndex(w => w.value === week);
    return idx > -1 ? idx : 0;
  }, [allWeekOptions, week]);
  
  const filterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!filterOpen) return;
    function handle(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [filterOpen]);
  
  const hasActiveFilters = category !== "all" || month !== INITIAL_MONTH || week !== INITIAL_WEEK || year !== INITIAL_YEAR;
  const [tipsOpen, setTipsOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handlePrevWeek = React.useCallback(() => {
    if (currentWeekIndex > 0) {
      setWeek(allWeekOptions[currentWeekIndex - 1].value);
      setPage(1);
    }
  }, [currentWeekIndex, allWeekOptions]);
  
  const handleNextWeek = React.useCallback(() => {
    if (currentWeekIndex < allWeekOptions.length - 1) {
      setWeek(allWeekOptions[currentWeekIndex + 1].value);
      setPage(1);
    }
  }, [currentWeekIndex, allWeekOptions]);

  // Debounce search query
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 500);
    return () => window.clearTimeout(timer);
  }, [q]);

  // Fetch data
  React.useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      const res = await listExpensesAction({
        q: debouncedQ,
        category,
        from: computeDateRange(year, month, week, weekOptions).from,
        to: computeDateRange(year, month, week, weekOptions).to,
        page,
        pageSize: PAGE_SIZE,
      });

      if (!active) return;

      if (!res.ok) {
        toast.error(res.error);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } else if (res.data) {
        setItems(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
      setLoading(false);
    }

    void fetchData();

    return () => {
      active = false;
    };
  }, [debouncedQ, category, year, month, week, page, refreshTrigger, weekOptions]);

  const refresh = React.useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const pageTotal = items.reduce((sum, x) => sum + x.amount, 0);

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
              {total} total • Page total:{" "}
              <span className="font-medium text-foreground">{formatInr(pageTotal)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search expenses..."
                  className="pl-9"
                />
              </div>
              
              <div className="relative ml-auto" ref={filterRef}>
                <Button
                  variant={hasActiveFilters ? "secondary" : "outline"}
                  onClick={() => setFilterOpen((p) => !p)}
                  className="relative px-3"
                  aria-label="Filter expenses"
                >
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
                    </span>
                  )}
                </Button>
                
                {filterOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-[var(--radius)] border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium leading-none">Filters</h4>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setCategory("all");
                            setYear(INITIAL_YEAR);
                            setMonth(INITIAL_MONTH);
                            setWeek(INITIAL_WEEK);
                            setPage(1);
                            setFilterOpen(false);
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Category</label>
                        <select
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            setPage(1);
                          }}
                          className="h-9 w-full appearance-none rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="all">All Categories</option>
                          {CATEGORIES.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Year</label>
                        <select
                          value={year}
                          onChange={(e) => {
                            setYear(e.target.value);
                            setWeek("all");
                            setPage(1);
                          }}
                          className="h-9 w-full appearance-none rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {yearOptions.map((y) => (
                            <option key={y.value} value={y.value}>
                              {y.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Month</label>
                        <select
                          value={month}
                          onChange={(e) => {
                            setMonth(e.target.value);
                            setWeek("all");
                            setPage(1);
                            setFilterOpen(false);
                          }}
                          className="h-9 w-full appearance-none rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="all">All Months</option>
                          {monthOptions.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      
                    </div>
                  </div>
                )}
              </div>
            </div>

            {month !== "all" && weekOptions.length > 0 && (
              <div className="relative overflow-hidden flex items-center justify-between rounded-[var(--radius)] border border-border/50 bg-background/40 backdrop-blur-xl p-1.5 shadow-sm animate-in fade-in-0 slide-in-from-left-8 duration-500 ease-out">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 shrink-0 rounded-sm" 
                  onClick={handlePrevWeek} 
                  disabled={currentWeekIndex <= 0}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-center truncate px-4">
                  {allWeekOptions[currentWeekIndex]?.label}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 shrink-0 rounded-sm" 
                  onClick={handleNextWeek} 
                  disabled={currentWeekIndex >= allWeekOptions.length - 1}
                  aria-label="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

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
              <>
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

