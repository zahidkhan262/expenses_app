"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";

import { addIncomeAction, listIncomeAction, type IncomeListItem } from "@/modules/income/actions";
import { incomeSchema, type IncomeInput } from "@/validations/income";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInr } from "@/utils/currency";

export function IncomeClient() {
  const [items, setItems] = React.useState<IncomeListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const form = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema) as never,
    defaultValues: { amount: 0, source: "Income", date: new Date() },
  });
  const selectedDate = form?.watch?.("date");

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const res = await listIncomeAction();
    if (!res.ok) toast.error(res.error);
    setItems(res.ok ? res.data ?? [] : []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const total = React.useMemo(() => items.reduce((sum, x) => sum + x.amount, 0), [items]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await addIncomeAction(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Income added");
    form.reset({ amount: 0, source: "Income", date: new Date() });
    void refresh();
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Income</h1>
          <p className="text-sm text-muted-foreground">Add income to calculate remaining balance.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total entries: <span className="font-medium text-foreground">{formatInr(total)}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Add income</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
                {form.formState.errors.amount?.message ? (
                  <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input id="source" placeholder="e.g. Salary" {...form.register("source")} />
                {form.formState.errors.source?.message ? (
                  <p className="text-sm text-destructive">{form.formState.errors.source.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={new Date(selectedDate).toISOString().slice(0, 10)}
                  onChange={(e) => form.setValue("date", new Date(e.target.value))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                <Plus className="h-4 w-4" />
                {form.formState.isSubmitting ? "Adding..." : "Add income"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[var(--radius)] border border-dashed border-border p-6 text-center">
                <p className="text-sm font-medium">No income records</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add an income entry to see remaining balance.
                </p>
              </div>
            ) : (
              items.map((x) => (
                <div
                  key={x.id}
                  className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-background p-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{x.source}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(x.date), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums">{formatInr(x.amount)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

