import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const BorrowHistorySchema = new Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    personName: { type: String, required: true },
    type: { type: String, enum: ["given", "taken"], required: true },
    notes: { type: String, default: "" },
    date: { type: Date, required: true },
    editedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const BorrowSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    amount: { type: Number, required: true, min: 0 },
    personName: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ["given", "taken"], required: true },
    status: { type: String, enum: ["active", "returned"], default: "active" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    date: { type: Date, required: true, index: true },
    history: { type: [BorrowHistorySchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

BorrowSchema.index({ userId: 1, date: -1 });

export type BorrowDoc = InferSchemaType<typeof BorrowSchema> & {
  _id: string;
};

export const Borrow: Model<BorrowDoc> =
  (models.Borrow as Model<BorrowDoc>) || model<BorrowDoc>("Borrow", BorrowSchema);
