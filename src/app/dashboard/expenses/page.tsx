import { requireUser } from "@/lib/auth";
import { ExpensesClient } from "@/modules/expenses/components/expenses-client";

export default async function ExpensesPage() {
  await requireUser();
  return <ExpensesClient />;
}

