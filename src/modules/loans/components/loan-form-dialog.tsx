"use client";

import * as React from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createLoanAction, updateLoanAction } from "@/modules/loans/actions";
import { loanSchema, type LoanInput } from "@/validations/loan";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  loan?: { id: string, title: string, principalAmount: number, roi: number, tenureMonths: number, startDate: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LoanFormDialog({ loan, open, onOpenChange, onSuccess }: Props) {
  const form = useForm<LoanInput>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      title: "",
      principalAmount: 0,
      roi: 0,
      tenureMonths: 0,
      startDate: new Date(),
    },
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (loan) {
        form.reset({
          title: loan.title,
          principalAmount: loan.principalAmount,
          roi: loan.roi,
          tenureMonths: loan.tenureMonths,
          startDate: new Date(loan.startDate),
        });
      } else {
        form.reset({ title: "", principalAmount: 0, roi: 0, tenureMonths: 0, startDate: new Date() });
      }
    }
  }, [open, loan, form]);

  const onSubmit = async (data: LoanInput) => {
    setLoading(true);
    const res = loan 
      ? await updateLoanAction(loan.id, data)
      : await createLoanAction(data);
    setLoading(false);

    if (res.ok) {
      toast.success(loan ? "Loan updated successfully" : "Loan created successfully");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(res.error || "Failed to save loan");
    }
  };

  const selectedDate = form.watch("startDate");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{loan ? "Edit Loan" : "Add New Loan"}</DialogTitle>
          <DialogDescription>
            Enter your loan details to generate the EMI schedule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Loan Title (e.g. Home Loan)</Label>
            <Input id="title" placeholder="Home Loan" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principalAmount">Principal Amount (₹)</Label>
              <Input
                id="principalAmount"
                type="number"
                step="any"
                placeholder="1500000"
                {...form.register("principalAmount")}
              />
              {form.formState.errors.principalAmount && (
                <p className="text-xs text-destructive">{form.formState.errors.principalAmount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="roi">ROI (% per year)</Label>
              <Input
                id="roi"
                type="number"
                step="any"
                placeholder="10.9"
                {...form.register("roi")}
              />
              {form.formState.errors.roi && (
                <p className="text-xs text-destructive">{form.formState.errors.roi.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenureMonths">Tenure (Months)</Label>
              <Input
                id="tenureMonths"
                type="number"
                placeholder="120"
                {...form.register("tenureMonths")}
              />
              {form.formState.errors.tenureMonths && (
                <p className="text-xs text-destructive">{form.formState.errors.tenureMonths.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  form.setValue("startDate", d);
                }}
              />
              {form.formState.errors.startDate && (
                <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Calculating & Saving..." : (loan ? "Save Changes" : "Create Loan")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
