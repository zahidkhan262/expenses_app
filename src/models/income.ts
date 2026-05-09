import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const IncomeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    source: { type: String, trim: true, maxlength: 140, default: "Income" },
    date: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

IncomeSchema.index({ userId: 1, date: -1 });

export type IncomeDoc = InferSchemaType<typeof IncomeSchema> & {
  _id: string;
};

export const Income: Model<IncomeDoc> =
  (models.Income as Model<IncomeDoc>) || model<IncomeDoc>("Income", IncomeSchema);

