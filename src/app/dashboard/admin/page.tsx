import { requireAdmin } from "@/lib/auth";
import { AdminClient } from "@/modules/admin/components/admin-client";

export default async function AdminPage() {
  await requireAdmin();
  return <AdminClient />;
}
