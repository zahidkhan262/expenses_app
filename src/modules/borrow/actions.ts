"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { connectToDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Borrow } from "@/models/borrow";
import { borrowSchema, type BorrowInput } from "@/validations/borrow";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export type BorrowHistoryItem = {
  title: string;
  amount: number;
  personName: string;
  type: "given" | "taken";
  notes: string;
  date: string;
  editedAt: string;
};

export type BorrowListItem = {
  id: string;
  title: string;
  amount: number;
  personName: string;
  type: "given" | "taken";
  status: "active" | "returned";
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  history: BorrowHistoryItem[];
};

type BorrowLean = {
  _id: Types.ObjectId;
  title: string;
  amount: number;
  personName: string;
  type: "given" | "taken";
  status?: "active" | "returned";
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  history?: {
    title: string;
    amount: number;
    personName: string;
    type: "given" | "taken";
    notes?: string;
    date: Date;
    editedAt: Date;
  }[];
};

function toItem(doc: BorrowLean): BorrowListItem {
  return {
    id: String(doc._id),
    title: doc.title,
    amount: doc.amount,
    personName: doc.personName,
    type: doc.type,
    status: doc.status || "active",
    notes: doc.notes || "",
    date: new Date(doc.date).toISOString(),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
    history: (doc.history ?? []).map((h) => ({
      title: h.title,
      amount: h.amount,
      personName: h.personName,
      type: h.type,
      notes: h.notes || "",
      date: new Date(h.date).toISOString(),
      editedAt: new Date(h.editedAt).toISOString(),
    })),
  };
}

export async function listBorrowsAction(params?: {
  q?: string;
  type?: string;
}): Promise<ActionResult<BorrowListItem[]>> {
  const user = await requireUser();
  await connectToDb();

  const query: Record<string, unknown> = { userId: user.sub };

  if (params?.q) {
    query.$or = [
      { title: { $regex: params.q, $options: "i" } },
      { personName: { $regex: params.q, $options: "i" } },
    ];
  }
  if (params?.type && params.type !== "all") {
    query.type = params.type as "given" | "taken";
  }

  const docs = await Borrow.find(query)
    .sort({ date: -1, createdAt: -1 })
    .limit(500)
    .lean<BorrowLean[]>();

  return { ok: true, data: docs.map(toItem) };
}

export async function createBorrowAction(input: BorrowInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = borrowSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await connectToDb();
  await Borrow.create({ ...parsed.data, userId: user.sub });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/borrows");
  return { ok: true };
}

export async function updateBorrowAction(id: string, input: BorrowInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = borrowSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await connectToDb();
  const existing = await Borrow.findOne({ _id: id, userId: user.sub });
  if (!existing) return { ok: false, error: "Borrow record not found" };

  existing.history.push({
    title: existing.title,
    amount: existing.amount,
    personName: existing.personName,
    type: existing.type,
    notes: existing.notes || "",
    date: existing.date,
    editedAt: new Date(),
  });

  existing.title = parsed.data.title;
  existing.amount = parsed.data.amount;
  existing.personName = parsed.data.personName;
  existing.type = parsed.data.type;
  existing.notes = parsed.data.notes;
  existing.date = parsed.data.date;

  await existing.save();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/borrows");
  return { ok: true };
}

export async function deleteBorrowAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await connectToDb();
  const res = await Borrow.deleteOne({ _id: id, userId: user.sub });
  if (res.deletedCount !== 1) return { ok: false, error: "Borrow record not found" };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/borrows");
  return { ok: true };
}

export async function markBorrowReturnedAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await connectToDb();
  const existing = await Borrow.findOne({ _id: id, userId: user.sub });
  if (!existing) return { ok: false, error: "Borrow record not found" };

  existing.status = "returned";
  await existing.save();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/borrows");
  return { ok: true };
}
