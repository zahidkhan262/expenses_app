"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Landmark, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { listLoansAction, deleteLoanAction } from "@/modules/loans/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInr } from "@/utils/currency";
import { LoanFormDialog } from "./loan-form-dialog";

export function LoansClient() {
  const [loans, setLoans] = React.useState<{ id: string, title: string, principalAmount: number, roi: number, tenureMonths: number, startDate: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  const fetchLoans = React.useCallback(async () => {
    setLoading(true);
    const res = await listLoansAction();
    if (res.ok && res.data) {
      setLoans(res.data);
    } else {
      toast.error(res.error || "Failed to load loans");
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLoans();
  }, [fetchLoans]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this loan?")) return;
    const res = await deleteLoanAction(id);
    if (res.ok) {
      toast.success("Loan deleted");
      fetchLoans();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-6 p-2 mb:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Loans</h1>
          <p className="text-sm text-muted-foreground">Track and manage your EMIs.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Loan
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Landmark className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No loans found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            You do not have any ongoing loans. Create one to start tracking your EMIs.
          </p>
          <Button onClick={() => setOpen(true)} variant="outline">Create your first loan</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => (
            <Link key={loan.id} href={`/dashboard/loans/${loan.id}`}>
              <Card className="hover:border-primary/50 transition-colors h-full flex flex-col group relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => handleDelete(e, loan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    {loan.title}
                  </CardTitle>
                  <CardDescription>
                    Started {format(new Date(loan.startDate), "MMM yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Principal:</span>
                      <span className="font-medium">{formatInr(loan.principalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ROI:</span>
                      <span className="font-medium">{loan.roi}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tenure:</span>
                      <span className="font-medium">{loan.tenureMonths} Months</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm font-medium text-primary">
                    View Details
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <LoanFormDialog open={open} onOpenChange={setOpen} onSuccess={fetchLoans} />
    </div>
  );
}
