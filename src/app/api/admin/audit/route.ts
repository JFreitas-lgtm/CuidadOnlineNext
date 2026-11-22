import { requireAdmin } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError, serialize } from "@/lib/utils";
import { AuditModel } from "@/models/Progress";
import { UserModel } from "@/models/User";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403);
  await connectDB();
  const entries = await AuditModel.find().sort({ createdAt: -1 }).limit(20).lean();
  const ids = [...new Set(entries.flatMap(entry => [entry.adminId, entry.targetUserId].filter(Boolean)).map(String))];
  const users = await UserModel.find({ _id: { $in: ids } }).select("name email").lean();
  const byId = new Map(users.map(user => [String(user._id), user]));
  return Response.json({ entries: serialize(entries.map(entry => ({ id: String(entry._id), action: entry.action, details: entry.details, createdAt: entry.createdAt, admin: byId.get(String(entry.adminId)) ?? null, target: entry.targetUserId ? byId.get(String(entry.targetUserId)) ?? null : null }))) });
}
