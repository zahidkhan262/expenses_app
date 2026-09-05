import { requireUser } from "@/lib/auth";
import { LoansClient } from "@/modules/loans/components/loans-client";

export default async function LoansPage() {
  await requireUser();
  return <LoansClient />;
}
