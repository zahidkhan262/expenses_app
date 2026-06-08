import { z } from "zod";

export const borrowSchema = z.object({
  title: z.string().min(2).max(140),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  personName: z.string().min(2).max(100),
  type: z.enum(["given", "taken"]),
  notes: z.string().max(500).optional().default(""),
  date: z.coerce.date(),
});

export type BorrowInput = z.infer<typeof borrowSchema>;
