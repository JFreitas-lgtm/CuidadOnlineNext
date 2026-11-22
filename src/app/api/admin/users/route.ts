import { requireAdmin } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError, serialize } from "@/lib/utils";
import { UserModel } from "@/models/User";
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403);
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim().slice(0, 120) ?? "";
  const status = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 12;
  const filter: Record<string, unknown> = {};
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
  if (status === "active" || status === "disabled") filter.status = status;
  await connectDB();
  const [rows, total] = await Promise.all([UserModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), UserModel.countDocuments(filter)]);
  return Response.json({ users: serialize(rows.map(u => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt }))), total, page, pages: Math.ceil(total / limit) });
}
