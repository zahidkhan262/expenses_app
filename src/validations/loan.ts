import { z } from "zod";

export const loanSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  principalAmount: z.coerce.number().positive("Amount must be positive"),
  roi: z.coerce.number().positive("ROI must be positive"),
  tenureMonths: z.coerce.number().int().positive("Tenure must be at least 1 month"),
  startDate: z.coerce.date(),
});

export type LoanInput = z.infer<typeof loanSchema>;
