import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const ExpenseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    date: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

ExpenseSchema.index({ userId: 1, createdAt: -1 });

export type ExpenseDoc = InferSchemaType<typeof ExpenseSchema> & {
  _id: string;
};

export const Expense: Model<ExpenseDoc> =
  (models.Expense as Model<ExpenseDoc>) || model<ExpenseDoc>("Expense", ExpenseSchema);

