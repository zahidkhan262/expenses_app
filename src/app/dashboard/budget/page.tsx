import { requireUser } from "@/lib/auth";
import { BudgetClient } from "@/modules/budget/components/budget-client";

export default async function BudgetPage() {
  await requireUser();
  return <BudgetClient />;
}

