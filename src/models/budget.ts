import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const BudgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    // Month key like "2026-05"
    month: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

BudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export type BudgetDoc = InferSchemaType<typeof BudgetSchema> & {
  _id: string;
};

export const Budget: Model<BudgetDoc> =
  (models.Budget as Model<BudgetDoc>) || model<BudgetDoc>("Budget", BudgetSchema);

