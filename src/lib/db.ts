import mongoose from "mongoose";
import { Resolver } from "node:dns/promises";

const MONGODB_URI = process.env.MONGODB_URI;
const customDnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(",")
  .map(server => server.trim())
  .filter(Boolean);
type Cache = { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongo = globalThis as typeof globalThis & { mongooseCache?: Cache };
const cache = globalWithMongo.mongooseCache ?? { connection: null, promise: null };
globalWithMongo.mongooseCache = cache;

async function resolveMongoUri(uri: string) {
  if (!uri.startsWith("mongodb+srv://") || !customDnsServers?.length) return uri;

  const parsed = new URL(uri);
  const resolver = new Resolver();
  resolver.setServers(customDnsServers);

  const records = await resolver.resolveSrv(`_mongodb._tcp.${parsed.hostname}`);
  const hosts = records
    .map(record => `${record.name.replace(/\.$/, "")}:${record.port}`)
    .join(",");
  const options = new URLSearchParams(parsed.search);

  const txtRecords = await resolver.resolveTxt(parsed.hostname).catch(() => []);
  for (const entry of txtRecords.flat().join("").split("&")) {
    if (!entry) continue;
    const [key, value = ""] = entry.split("=", 2);
    if (!options.has(key)) options.set(key, value);
  }
  if (!options.has("tls")) options.set("tls", "true");

  return `mongodb://${parsed.username}:${parsed.password}@${hosts}${parsed.pathname}?${options}`;
}

export async function connectDB() {
  if (!MONGODB_URI || MONGODB_URI === "COLE_AQUI_A_URI_DO_MONGODB_ATLAS") {
    throw new Error("Cole a URI do MongoDB Atlas em MONGODB_URI no arquivo .env.local.");
  }
  if (!/^mongodb(\+srv)?:\/\//.test(MONGODB_URI)) {
    throw new Error("MONGODB_URI inválida: use a conexão fornecida em Atlas > Connect > Drivers.");
  }
  if (MONGODB_URI.includes("<db_password>") || MONGODB_URI.includes("<password>")) {
    throw new Error("Substitua <db_password> pela senha do usuário do MongoDB Atlas.");
  }
  if (cache.connection) return cache.connection;
  cache.promise ??= resolveMongoUri(MONGODB_URI)
    .then(uri => mongoose.connect(uri, { bufferCommands: false }));
  try {
    cache.connection = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.connection;
}
