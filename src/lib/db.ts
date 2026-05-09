import mongoose from "mongoose";

const MONGODB_URI = (process.env.MONGODB_URI ?? "").trim();

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI env var");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis._mongoose ?? { conn: null, promise: null };
globalThis._mongoose = cached;

export async function connectToDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

