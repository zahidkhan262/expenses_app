"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createBorrowAction,
  updateBorrowAction,
  type BorrowListItem,
} from "@/modules/borrow/actions";
import { borrowSchema, type BorrowInput } from "@/validations/borrow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BorrowFormDialog({
  trigger,
  borrow,
  onSaved,
}: {
  trigger: React.ReactNode;
  borrow?: BorrowListItem;
  onSaved?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<BorrowInput>({
    resolver: zodResolver(borrowSchema) as never,
    defaultValues: {
      title: borrow?.title ?? "",
      amount: borrow?.amount ?? 0,
      personName: borrow?.personName ?? "",
      type: borrow?.type ?? "given",
      notes: borrow?.notes ?? "",
      date: borrow?.date ? new Date(borrow.date) : new Date(),
    },
  });
  const selectedDate = form?.watch?.("date");

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      title: borrow?.title ?? "",
      amount: borrow?.amount ?? 0,
      personName: borrow?.personName ?? "",
      type: borrow?.type ?? "given",
      notes: borrow?.notes ?? "",
      date: borrow?.date ? new Date(borrow.date) : new Date(),
    });
  }, [open, borrow, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = borrow
      ? await updateBorrowAction(borrow.id, values)
      : await createBorrowAction(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(borrow ? "Borrow updated" : "Borrow added");
    setOpen(false);
    onSaved?.();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{borrow ? "Edit borrow" : "Add borrow"}</DialogTitle>
          <DialogDescription>
            Track money you gave to someone or took from someone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="borrow-title">Title</Label>
            <Input
              id="borrow-title"
              placeholder="e.g. Lunch advance"
              {...form.register("title")}
            />
            {form.formState.errors.title?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="borrow-amount">Amount</Label>
              <Input
                id="borrow-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("amount")}
              />
              {form.formState.errors.amount?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrow-type">Type</Label>
              <select
                id="borrow-type"
                {...form.register("type")}
                className="h-10 w-full appearance-none rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="given">I gave (they owe me)</option>
                <option value="taken">I took (I owe them)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrow-person">Person name</Label>
            <Input
              id="borrow-person"
              placeholder="Who took or gave the money?"
              {...form.register("personName")}
            />
            {form.formState.errors.personName?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.personName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrow-date">Date</Label>
            <Input
              id="borrow-date"
              type="date"
              value={new Date(selectedDate).toISOString().slice(0, 10)}
              onChange={(e) => form.setValue("date", new Date(e.target.value))}
            />
            {form.formState.errors.date?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrow-notes">Notes</Label>
            <Input
              id="borrow-notes"
              placeholder="Optional notes..."
              {...form.register("notes")}
            />
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
