import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { requireUser } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { deleteAccountSchema, profileSchema } from "@/lib/validation";
import { UserModel } from "@/models/User";
import { ProgressModel, QuizAttemptModel, SimulationAttemptModel, AuditModel } from "@/models/Progress";

export async function GET() { const user = await requireUser(); if (!user) return apiError("AUTH_REQUIRED", "Entre para continuar.", 401); return Response.json({ user }); }
export async function PATCH(request: Request) {
  const user = await requireUser(); if (!user) return apiError("AUTH_REQUIRED", "Entre para continuar.", 401);
  const parsed = profileSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("VALIDATION_ERROR", "Confira os campos.", 400, parsed.error.flatten().fieldErrors);
  await connectDB(); const updated = await UserModel.findByIdAndUpdate(user.id, parsed.data, { new: true, runValidators: true }).lean();
  return Response.json({ user: { id: String(updated._id), name: updated.name, email: updated.email, role: updated.role, status: updated.status, theme: updated.theme } });
}
export async function DELETE(request: Request) {
  const user = await requireUser(); if (!user) return apiError("AUTH_REQUIRED", "Entre para continuar.", 401);
  const parsed = deleteAccountSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("VALIDATION_ERROR", "Confirme sua senha.", 400);
  await connectDB(); const record = await UserModel.findById(user.id).select("+passwordHash"); if (!record || !(await bcrypt.compare(parsed.data.password, record.passwordHash))) return apiError("INVALID_PASSWORD", "Senha incorreta.", 400);
  const id = new mongoose.Types.ObjectId(user.id); await Promise.all([UserModel.deleteOne({ _id: id }), ProgressModel.deleteOne({ userId: id }), QuizAttemptModel.deleteMany({ userId: id }), SimulationAttemptModel.deleteMany({ userId: id }), AuditModel.deleteMany({ $or: [{ adminId: id }, { targetUserId: id }] })]);
  return new Response(null, { status: 204 });
}
