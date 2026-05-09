import { z } from "zod";

export const expenseSchema = z.object({
  title: z.string().min(2).max(140),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1),
  notes: z.string().max(500).optional().default(""),
  date: z.coerce.date(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

