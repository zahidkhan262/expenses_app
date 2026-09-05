import mongoose from "mongoose";

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

export const Loan = mongoose.models.Loan || mongoose.model("Loan", LoanSchema);
