"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Pencil } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { toggleInstallmentAction } from "@/modules/loans/actions";
import { LoanFormDialog } from "./loan-form-dialog";
import { formatInr } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Props {
  loan: { id: string, title: string, principalAmount: number, roi: number, tenureMonths: number, installments: unknown[] };
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))"];

export function LoanDetailsClient({ loan }: Props) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const installments = loan.installments as { id: string, isPaid: boolean, monthDate: string, monthNumber: number, emi: number, principalComponent: number, interestComponent: number, remainingBalance: number }[];
  const totalPrincipal = loan.principalAmount;
  const totalInterest = installments.reduce((acc, curr) => acc + curr.interestComponent, 0);
  const totalAmount = totalPrincipal + totalInterest;
  
  const paidInstallments = installments.filter((i) => i.isPaid);
  const totalPaid = paidInstallments.reduce((acc, curr) => acc + curr.emi, 0);
  const remainingTotal = totalAmount - totalPaid;
  const remainingMonths = loan.tenureMonths - paidInstallments.length;

  const chartData = [
    { name: "Principal", value: totalPrincipal },
    { name: "Total Interest", value: totalInterest },
  ];

  const handleToggle = async (installmentId: string, isPaid: boolean) => {
    setLoadingId(installmentId);
    const res = await toggleInstallmentAction(loan.id, installmentId, isPaid);
    setLoadingId(null);
    if (res.ok) {
      toast.success(`EMI marked as ${isPaid ? 'Paid' : 'Pending'}`);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-5 p-2 sm:space-y-6 sm:p-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0">
          <Link href="/dashboard/loans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
              <h1 className="min-w-0 break-words text-xl font-bold tracking-tight sm:text-2xl">{loan.title}</h1>
              <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {loan.tenureMonths} Months • {loan.roi}% ROI
            </p>
          </div>
        </div>
      </div>
      
      <LoanFormDialog loan={loan} open={editOpen} onOpenChange={setEditOpen} onSuccess={() => {}} />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium">Principal Amount</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="break-words text-xl font-bold sm:text-2xl">{formatInr(totalPrincipal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="break-words text-xl font-bold sm:text-2xl">{formatInr(totalInterest)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="break-words text-xl font-bold text-primary sm:text-2xl">{formatInr(totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidInstallments.length} / {loan.tenureMonths} Months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium">Remaining Total</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="break-words text-xl font-bold sm:text-2xl">{formatInr(remainingTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {remainingMonths} Months Left
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Amount Breakdown</CardTitle>
            <CardDescription>Principal vs Interest</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[240px] flex-1 flex-col items-center justify-center p-4 pt-0 sm:min-h-[260px] sm:p-6 sm:pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="48%"
                  outerRadius="66%"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatInr(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full text-center mt-2 text-sm text-muted-foreground">
              EMI: <span className="font-semibold text-foreground">{formatInr(installments[0]?.emi || 0)}</span> / month
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Amortization Schedule</CardTitle>
            <CardDescription>Track your monthly EMI payments</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3 sm:hidden">
              {installments.map((inst) => {
                const dueDate = new Date(inst.monthDate);
                const daysUntilDue = differenceInDays(dueDate, new Date());
                const isDueSoon = !inst.isPaid && daysUntilDue <= 4;
                
                return (
                  <div
                    key={inst.id}
                    className={cn(
                      "rounded-md border p-3 transition-all",
                      inst.isPaid && "border-green-500/30 bg-green-500/15",
                      isDueSoon && "border-red-500/30 bg-red-500/15"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{format(dueDate, "MMM yyyy")}</div>
                        <div className="text-xs text-muted-foreground">Month {inst.monthNumber}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={loadingId === inst.id}
                        onClick={() => handleToggle(inst.id, !inst.isPaid)}
                        className={cn("h-9 w-9 shrink-0", inst.isPaid ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground")}
                      >
                        {inst.isPaid ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">EMI</div>
                        <div className="font-medium">{formatInr(inst.emi)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className="font-medium">{formatInr(inst.remainingBalance)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Principal</div>
                        <div>{formatInr(inst.principalComponent)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Interest</div>
                        <div>{formatInr(inst.interestComponent)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden h-[400px] overflow-auto rounded-md border sm:block">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[100px]">Month</TableHead>
                    <TableHead>EMI</TableHead>
                    <TableHead className="hidden sm:table-cell">Principal</TableHead>
                    <TableHead className="hidden sm:table-cell">Interest</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((inst) => 
                  {
                    const dueDate = new Date(inst.monthDate);
                    const daysUntilDue = differenceInDays(dueDate, new Date());
                    const isDueSoon = !inst.isPaid && daysUntilDue <= 4;
                    
                    return (
                    <TableRow 
                      key={inst.id}
                      className={cn(
                        "transition-all",
                        inst.isPaid && "bg-green-500/15 hover:bg-green-500/25",
                        isDueSoon && "bg-red-500/15 hover:bg-red-500/25 animate-pulse hover:animate-none"
                      )}
                    >

                      <TableCell className="font-medium">
                        <div>{format(new Date(inst.monthDate), "MMM yyyy")}</div>
                        <div className="text-[10px] text-muted-foreground">Month {inst.monthNumber}</div>
                      </TableCell>
                      <TableCell>{formatInr(inst.emi)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatInr(inst.principalComponent)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatInr(inst.interestComponent)}</TableCell>
                      <TableCell className="text-right font-medium">{formatInr(inst.remainingBalance)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={loadingId === inst.id}
                          onClick={() => handleToggle(inst.id, !inst.isPaid)}
                          className={cn(inst.isPaid ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground")}
                        >
                          {inst.isPaid ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
