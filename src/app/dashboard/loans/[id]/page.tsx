import { requireUser } from "@/lib/auth";
import { LoanDetailsClient } from "@/modules/loans/components/loan-details-client";
import { getLoanDetailsAction } from "@/modules/loans/actions";
import { notFound } from "next/navigation";

export default async function LoanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = (await params).id;
  const res = await getLoanDetailsAction(id);
  
  if (!res.ok || !res.data) {
    notFound();
  }

  return <LoanDetailsClient loan={res.data} />;
}
