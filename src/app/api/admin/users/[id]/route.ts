import { z } from "zod";
import { requireAdmin } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { UserModel } from "@/models/User";
import { AuditModel } from "@/models/Progress";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) { const admin = await requireAdmin(); if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403); const parsed = z.object({ status: z.enum(["active", "disabled"]) }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("VALIDATION_ERROR", "Status inválido.", 400); const { id } = await params; if (id === admin.id) return apiError("SELF_UPDATE", "Você não pode desativar sua própria conta.", 400); await connectDB(); const user = await UserModel.findByIdAndUpdate(id, parsed.data, { new: true }); if (!user) return apiError("NOT_FOUND", "Usuário não encontrado.", 404); await AuditModel.create({ adminId: admin.id, targetUserId: id, action: `user.${parsed.data.status}` }); return Response.json({ user: { id: user.id, status: user.status } }); }
