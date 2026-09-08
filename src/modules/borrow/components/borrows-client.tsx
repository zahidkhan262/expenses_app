"use client";

import * as React from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronUp, History, Pencil, Plus, Search, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

import {
  deleteBorrowAction,
  listBorrowsAction,
  markBorrowReturnedAction,
  type BorrowListItem,
} from "@/modules/borrow/actions";
import { BorrowFormDialog } from "@/modules/borrow/components/borrow-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatInr } from "@/utils/currency";

function BorrowRow({
  item,
  onRefresh,
}: {
  item: BorrowListItem;
  onRefresh: () => void;
}) {
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const isGiven = item.type === "given";

  return (
    <div className="rounded-[var(--radius)] border border-border bg-background p-4">
      <div className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-md p-1.5",
                isGiven
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              )}
            >
              {isGiven ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownLeft className="h-4 w-4" />
              )}
            </span>
            <p className="truncate text-sm font-semibold">{item.title}</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={cn(isGiven ? "border-emerald-500/30" : "border-rose-500/30")}>
              {isGiven ? "I gave" : "I took"}
            </Badge>
            {item.status === "returned" && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
                Returned
              </Badge>
            )}
            <span>{item.personName}</span>
            <span>•</span>
            <span>{format(new Date(item.date), "MMM d, yyyy")}</span>
            {item.notes ? (
              <>
                <span>•</span>
                <span className="truncate">{item.notes}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <p className="text-sm font-semibold tabular-nums">{formatInr(item.amount)}</p>
          <div className="flex gap-1">
            {item.status !== "returned" ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Mark as returned"
                onClick={() => {
                  toast("Mark this borrow as returned?", {
                    action: {
                      label: "Confirm",
                      onClick: async () => {
                        const res = await markBorrowReturnedAction(item.id);
                        if (!res.ok) toast.error(res.error);
                        else toast.success("Marked as returned");
                        onRefresh();
                      },
                    },
                    cancel: {
                      label: "Cancel",
                      onClick: () => {},
                    },
                  });
                }}
              >
                <Check className="h-4 w-4 text-emerald-500" />
              </Button>
            ) : null}
            {item.history.length > 0 ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Toggle history"
                onClick={() => setHistoryOpen((prev) => !prev)}
              >
                {historyOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <History className="h-4 w-4" />
                )}
              </Button>
            ) : null}
            <BorrowFormDialog
              borrow={item}
              trigger={
                <Button size="icon" variant="ghost" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
              onSaved={onRefresh}
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete"
              onClick={() => {
                toast("Delete this borrow record?", {
                  action: {
                    label: "Confirm",
                    onClick: async () => {
                      const res = await deleteBorrowAction(item.id);
                      if (!res.ok) toast.error(res.error);
                      else toast.success("Borrow deleted");
                      onRefresh();
                    },
                  },
                  cancel: {
                    label: "Cancel",
                    onClick: () => {},
                  },
                });
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      {historyOpen && item.history.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Edit history</p>
          {item.history
            .slice()
            .reverse()
            .map((h, idx) => (
              <div
                key={idx}
                className="rounded-[var(--radius)] bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{h.title}</span>
                  <span>{formatInr(h.amount)}</span>
                  <span>• {h.personName}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {h.type === "given" ? "I gave" : "I took"}
                  </Badge>
                </div>
                <p className="mt-1">
                  Edited {format(new Date(h.editedAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}

function groupItemsByPerson(items: BorrowListItem[]) {
  return items.reduce((acc, item) => {
    const name = item.personName || "Unknown";
    if (!acc[name]) acc[name] = [];
    acc[name].push(item);
    return acc;
  }, {} as Record<string, BorrowListItem[]>);
}

export function BorrowsClient() {
  const [items, setItems] = React.useState<BorrowListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [type, setType] = React.useState<string>("all");

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 500);
    return () => window.clearTimeout(timer);
  }, [q]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const res = await listBorrowsAction({ q: debouncedQ, type });
    if (!res.ok) toast.error(res.error);
    setItems(res.ok ? res.data ?? [] : []);
    setLoading(false);
  }, [debouncedQ, type]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const givenTotal = React.useMemo(
    () => items.filter((x) => x.type === "given" && x.status !== "returned").reduce((sum, x) => sum + x.amount, 0),
    [items],
  );
  const takenTotal = React.useMemo(
    () => items.filter((x) => x.type === "taken" && x.status !== "returned").reduce((sum, x) => sum + x.amount, 0),
    [items],
  );

  const activeItems = items.filter(x => x.status !== "returned");
  const historyItems = items.filter(x => x.status === "returned");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Borrow</h1>
          <p className="text-sm text-muted-foreground">
            Track money you gave or took from others.
          </p>
        </div>
        <BorrowFormDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Add borrow
            </Button>
          }
          onSaved={refresh}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total given (they owe you)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatInr(givenTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total taken (you owe them)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              {formatInr(takenTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle>Borrow Records</CardTitle>
          <div className="text-sm text-muted-foreground">
            Net Active:{" "}
            <span className="font-medium text-foreground">
              {formatInr(givenTotal - takenTotal)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title or person..."
                className="pl-9"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 w-full appearance-none rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
            >
              <option value="all">All types</option>
              <option value="given">I gave</option>
              <option value="taken">I took</option>
            </select>
          </div>

          <Separator />
          
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="active">Active ({activeItems.length})</TabsTrigger>
              <TabsTrigger value="history">History ({historyItems.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : activeItems.length === 0 ? (
                <div className="rounded-[var(--radius)] border border-dashed border-border p-6 text-center">
                  <p className="text-sm font-medium">No active borrow records</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have no active borrowings pending.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupItemsByPerson(activeItems)).map(([person, personItems]) => (
                    <div key={person} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {person.charAt(0).toUpperCase()}
                        </span>
                        <h3 className="text-sm font-semibold tracking-tight">{person}</h3>
                      </div>
                      <div className="space-y-3">
                        {personItems.map((x) => (
                          <BorrowRow key={x.id} item={x} onRefresh={refresh} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : historyItems.length === 0 ? (
                <div className="rounded-[var(--radius)] border border-dashed border-border p-6 text-center">
                  <p className="text-sm font-medium">No borrow history</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Returned money will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 opacity-80 hover:opacity-100 transition-opacity">
                  {Object.entries(groupItemsByPerson(historyItems)).map(([person, personItems]) => (
                    <div key={person} className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {person.charAt(0).toUpperCase()}
                        </span>
                        <h3 className="text-sm font-semibold">{person}</h3>
                      </div>
                      <div className="space-y-3">
                        {personItems.map((x) => (
                          <BorrowRow key={x.id} item={x} onRefresh={refresh} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <BorrowFormDialog
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
