"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createExpenseAction, updateExpenseAction, type ExpenseListItem } from "@/modules/expenses/actions";
import { expenseSchema, type ExpenseInput } from "@/validations/expense";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES } from "@/utils/categories";

export function ExpenseFormDialog({
  trigger,
  expense,
  onSaved,
}: {
  trigger: React.ReactNode;
  expense?: ExpenseListItem;
  onSaved?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema) as never,
    defaultValues: {
      title: expense?.title ?? "",
      amount: expense?.amount ?? 0,
      category: expense?.category ?? CATEGORIES[0]!.key,
      notes: expense?.notes ?? "",
      date: expense?.date ? new Date(expense.date) : new Date(),
    },
  });
  const selectedDate = form?.watch?.("date");

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      title: expense?.title ?? "",
      amount: expense?.amount ?? 0,
      category: expense?.category ?? CATEGORIES[0]!.key,
      notes: expense?.notes ?? "",
      date: expense?.date ? new Date(expense.date) : new Date(),
    });
  }, [open, expense, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = expense
      ? await updateExpenseAction(expense.id, values)
      : await createExpenseAction(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(expense ? "Expense updated" : "Expense added");
    setOpen(false);
    onSaved?.();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Keep your daily expenses clean and categorized.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Uber ride" {...form.register("title")} />
            {form.formState.errors.title?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" {...form.register("amount")} />
              {form.formState.errors.amount?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...form.register("category")}
                className="h-10 w-full appearance-none rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.category?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={new Date(selectedDate).toISOString().slice(0, 10)}
              onChange={(e) => form.setValue("date", new Date(e.target.value))}
            />
            {form.formState.errors.date?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Optional notes..." {...form.register("notes")} />
            {form.formState.errors.notes?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

