import { z } from "zod";

export const budgetSchema = z.object({
  amount: z.coerce.number().min(0.01, "Budget must be greater than 0"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

