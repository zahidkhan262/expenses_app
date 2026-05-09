"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { ExpenseFormDialog } from "@/modules/expenses/components/expense-form-dialog";
import { Button } from "@/components/ui/button";

export function AddExpenseHeaderButton() {
  const router = useRouter();

  return (
    <ExpenseFormDialog
      onSaved={() => router.refresh()}
      trigger={
        <Button>
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
      }
    />
  );
}

