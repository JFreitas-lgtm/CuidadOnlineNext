import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
type Cache = { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongo = globalThis as typeof globalThis & { mongooseCache?: Cache };
const cache = globalWithMongo.mongooseCache ?? { connection: null, promise: null };
globalWithMongo.mongooseCache = cache;

export async function connectDB() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI não foi configurada.");
  if (cache.connection) return cache.connection;
  cache.promise ??= mongoose.connect(MONGODB_URI, { bufferCommands: false });
  try {
    cache.connection = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.connection;
}
