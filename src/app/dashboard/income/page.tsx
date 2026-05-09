import { requireUser } from "@/lib/auth";
import { IncomeClient } from "@/modules/income/components/income-client";

export default async function IncomePage() {
  await requireUser();
  return <IncomeClient />;
}

