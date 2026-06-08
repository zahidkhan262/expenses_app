"use client";

import * as React from "react";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { listUsersAction, type AdminUserItem } from "@/modules/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatInr } from "@/utils/currency";

export function AdminClient() {
  const [users, setUsers] = React.useState<AdminUserItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await listUsersAction();
      if (!res.ok) toast.error(res.error);
      setUsers(res.ok ? res.data ?? [] : []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          View all registered users and their activity.
        </p>
      </div>

      <Card className="mt-5">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Users</CardTitle>
          </div>
          <Badge variant="outline">{users.length} total</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="rounded-[var(--radius)] border border-border p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Joined {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{u.expenseCount} expenses</Badge>
                      <Badge variant="outline">{u.incomeCount} income</Badge>
                      <Badge variant="outline">{u.budgetCount} budgets</Badge>
                      <Badge variant="outline">{u.borrowCount} borrows</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>
                      Total spent:{" "}
                      <span className="font-medium text-foreground">
                        {formatInr(u.totalExpenses)}
                      </span>
                    </span>
                    <span>
                      Total income:{" "}
                      <span className="font-medium text-foreground">
                        {formatInr(u.totalIncome)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
