import { requireAdmin } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError, serialize } from "@/lib/utils";
import { UserModel } from "@/models/User";
export async function GET(request: Request) { const admin = await requireAdmin(); if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403); const url = new URL(request.url); const search = url.searchParams.get("q")?.slice(0, 120) ?? ""; await connectDB(); const filter = search ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] } : {}; const users = await UserModel.find(filter).sort({ createdAt: -1 }).limit(100).lean(); return Response.json({ users: serialize(users.map(u => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt }))) }); }
