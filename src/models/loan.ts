import mongoose, { Document, Types } from "mongoose";

export interface IInstallment {
  _id?: Types.ObjectId;
  monthDate: Date;
  monthNumber: number;
  emi: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
  isPaid: boolean;
}

export interface ILoan extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  principalAmount: number;
  roi: number;
  tenureMonths: number;
  startDate: Date;
  installments: IInstallment[];
  createdAt: Date;
  updatedAt: Date;
}

const InstallmentSchema = new mongoose.Schema({
  monthDate: { type: Date, required: true },
  monthNumber: { type: Number, required: true },
  emi: { type: Number, required: true },
  principalComponent: { type: Number, required: true },
  interestComponent: { type: Number, required: true },
  remainingBalance: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
});

const LoanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  principalAmount: { type: Number, required: true },
  roi: { type: Number, required: true },
  tenureMonths: { type: Number, required: true },
  startDate: { type: Date, required: true },
  installments: [InstallmentSchema],
}, { timestamps: true });

export const Loan = mongoose.models.Loan as mongoose.Model<ILoan> || mongoose.model<ILoan>("Loan", LoanSchema);
