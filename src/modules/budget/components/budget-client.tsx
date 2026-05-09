"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { getBudgetAction, setBudgetAction } from "@/modules/budget/actions";
import { budgetSchema, type BudgetInput } from "@/validations/budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BudgetClient() {
  const currentMonth = format(new Date(), "yyyy-MM");
  const [loading, setLoading] = React.useState(true);

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema) as never,
    defaultValues: { month: currentMonth, amount: 0 },
  });

  const load = React.useCallback(async (month: string) => {
    setLoading(true);
    const res = await getBudgetAction(month);
    if (!res.ok) toast.error(res.error);
    form.setValue("amount", res.ok && res.data?.amount != null ? res.data.amount : 0);
    setLoading(false);
  }, [form]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(currentMonth);
  }, [currentMonth, load]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await setBudgetAction(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Budget saved");
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Budget</h1>
        <p className="text-sm text-muted-foreground">Set a monthly budget to track progress.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    placeholder="YYYY-MM"
                    {...form.register("month")}
                    onBlur={(e) => {
                      form.register("month").onBlur(e);
                      void load(e.currentTarget.value);
                    }}
                  />
                  {form.formState.errors.month?.message ? (
                    <p className="text-sm text-destructive">{form.formState.errors.month.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" step="0.01" {...form.register("amount")} disabled={loading} />
                  {form.formState.errors.amount?.message ? (
                    <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                  ) : null}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loading}>
                {form.formState.isSubmitting ? "Saving..." : "Save budget"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Your dashboard shows budget remaining and a progress bar based on monthly expenses.
            </p>
            <p>
              Tip: set income for the month to calculate remaining balance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

