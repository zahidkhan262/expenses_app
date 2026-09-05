"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";

import { connectToDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Loan } from "@/models/loan";
import { loanSchema, type LoanInput } from "@/validations/loan";

export async function createLoanAction(input: LoanInput) {
  try {
    const user = await requireUser();

    const parsed = loanSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid data" };
    
    await connectToDb();
    
    const { title, principalAmount, roi, tenureMonths, startDate } = parsed.data;
    
    const P = principalAmount;
    const r = roi / 12 / 100;
    const n = tenureMonths;
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    
    let remainingBalance = P;
    const installments = [];
    
    for (let i = 1; i <= n; i++) {
      const interestForMonth = remainingBalance * r;
      let principalForMonth = emi - interestForMonth;
      
      if (i === n) {
        principalForMonth = remainingBalance;
      }
      
      remainingBalance -= principalForMonth;
      if (remainingBalance < 0) remainingBalance = 0;
      
      installments.push({
        monthDate: addMonths(startDate, i - 1),
        monthNumber: i,
        emi: i === n ? principalForMonth + interestForMonth : emi,
        principalComponent: principalForMonth,
        interestComponent: interestForMonth,
        remainingBalance: remainingBalance,
        isPaid: false
      });
    }

    await Loan.create({
      userId: user.sub,
      title,
      principalAmount,
      roi,
      tenureMonths,
      startDate,
      installments,
    });
    
    revalidatePath("/dashboard/loans");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create loan" };
  }
}

export async function listLoansAction() {
  try {
    const user = await requireUser();
    
    await connectToDb();
    
    const loans = await Loan.find({ userId: user.sub })
      .select("-installments")
      .sort({ createdAt: -1 })
      .lean();
      
    return { 
      ok: true, 
      data: loans.map((l: { _id: unknown, title: string, principalAmount: number, roi: number, tenureMonths: number, startDate: Date }) => ({
        id: l._id.toString(),
        title: l.title,
        principalAmount: l.principalAmount,
        roi: l.roi,
        tenureMonths: l.tenureMonths,
        startDate: l.startDate.toISOString(),
      }))
    };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getLoanDetailsAction(id: string) {
  try {
    const user = await requireUser();
    
    await connectToDb();
    
    const loan = (await Loan.findOne({ _id: id, userId: user.sub }).lean()) as any;
    if (!loan) return { ok: false, error: "Not found" };
    
    return { 
      ok: true, 
      data: {
        id: loan._id.toString(),
        title: loan.title,
        principalAmount: loan.principalAmount,
        roi: loan.roi,
        tenureMonths: loan.tenureMonths,
        startDate: loan.startDate.toISOString(),
        installments: loan.installments.map((inst: { _id?: unknown, monthDate: Date, monthNumber: number, emi: number, principalComponent: number, interestComponent: number, remainingBalance: number, isPaid: boolean }) => ({
          id: inst._id?.toString(),
          monthDate: inst.monthDate.toISOString(),
          monthNumber: inst.monthNumber,
          emi: inst.emi,
          principalComponent: inst.principalComponent,
          interestComponent: inst.interestComponent,
          remainingBalance: inst.remainingBalance,
          isPaid: inst.isPaid
        }))
      }
    };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function toggleInstallmentAction(loanId: string, installmentId: string, isPaid: boolean) {
  try {
    const user = await requireUser();
    
    await connectToDb();
    
    const loan = await Loan.findOneAndUpdate(
      { _id: loanId, userId: user.sub, "installments._id": installmentId },
      { $set: { "installments.$.isPaid": isPaid } },
      { new: true }
    );
    
    if (!loan) return { ok: false, error: "Not found" };
    
    revalidatePath(`/dashboard/loans/${loanId}`);
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteLoanAction(id: string) {
  try {
    const user = await requireUser();
    
    await connectToDb();
    
    await Loan.findOneAndDelete({ _id: id, userId: user.sub });
    
    revalidatePath("/dashboard/loans");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateLoanAction(loanId: string, input: LoanInput) {
  try {
    const user = await requireUser();
    
    const parsed = loanSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid data" };
    
    await connectToDb();
    
    const existingLoan = await Loan.findOne({ _id: loanId, userId: user.sub });
    if (!existingLoan) return { ok: false, error: "Not found" };

    const { title, principalAmount, roi, tenureMonths, startDate } = parsed.data;
    
    const P = principalAmount;
    const r = roi / 12 / 100;
    const n = tenureMonths;
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    
    let remainingBalance = P;
    const installments = [];
    
    const oldInstallmentsMap = new Map(existingLoan.installments.map((i: { monthNumber: number, isPaid: boolean }) => [i.monthNumber, i.isPaid]));
    
    for (let i = 1; i <= n; i++) {
      const interestForMonth = remainingBalance * r;
      let principalForMonth = emi - interestForMonth;
      
      if (i === n) {
        principalForMonth = remainingBalance;
      }
      
      remainingBalance -= principalForMonth;
      if (remainingBalance < 0) remainingBalance = 0;
      
      installments.push({
        monthDate: addMonths(startDate, i - 1),
        monthNumber: i,
        emi: i === n ? principalForMonth + interestForMonth : emi,
        principalComponent: principalForMonth,
        interestComponent: interestForMonth,
        remainingBalance: remainingBalance,
        isPaid: oldInstallmentsMap.get(i) || false
      });
    }

    await Loan.findOneAndUpdate(
      { _id: loanId, userId: user.sub },
      { title, principalAmount, roi, tenureMonths, startDate, installments }
    );
    
    revalidatePath(`/dashboard/loans/${loanId}`);
    revalidatePath("/dashboard/loans");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update loan" };
  }
}
