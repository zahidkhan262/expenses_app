import { requireUser } from "@/lib/auth";
import { BorrowsClient } from "@/modules/borrow/components/borrows-client";

export default async function BorrowsPage() {
  await requireUser();
  return <BorrowsClient />;
}
