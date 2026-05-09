import { z } from "zod";

export const incomeSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  source: z.string().min(1).max(140).default("Income"),
  date: z.coerce.date(),
});

export type IncomeInput = z.infer<typeof incomeSchema>;

