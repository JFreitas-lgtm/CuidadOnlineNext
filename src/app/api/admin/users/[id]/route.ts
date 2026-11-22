import { z } from "zod";
import { requireAdmin } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { UserModel } from "@/models/User";
import { AuditModel, ProgressModel, QuizAttemptModel, SimulationAttemptModel } from "@/models/Progress";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const admin = await requireAdmin();
  if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403);
  const { id } = await params;
  await connectDB();
  const completedQuiz = { userId: id, $or: [{ status: "completed" }, { status: { $exists: false } }] };
  const [user, progress, quizzes, simulations] = await Promise.all([
    UserModel.findById(id).lean(),
    ProgressModel.findOne({ userId: id }).lean(),
    QuizAttemptModel.find(completedQuiz).sort({ createdAt: -1 }).limit(10).lean(),
    SimulationAttemptModel.find({ userId: id }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  if (!user) return apiError("NOT_FOUND", "Usuário não encontrado.", 404);
  const lessons = (progress?.lessons ?? []) as Array<{ slug?: string; completedAt?: Date; favorite?: boolean }>;
  return Response.json({
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt },
    progress: {
      completed: lessons.filter((item) => item.completedAt).map((item) => item.slug),
      favorites: lessons.filter((item) => item.favorite).map((item) => item.slug),
      lastLesson: progress?.lastLesson ?? null,
      quizzes: quizzes.map((item) => ({ id: String(item._id), score: item.score, total: item.total, createdAt: item.createdAt })),
      simulations: simulations.map((item) => ({ id: String(item._id), slug: item.simulationSlug, outcome: item.outcome, createdAt: item.createdAt })),
    },
  });
}

export async function PATCH(request: Request, { params }: Context) {
  const admin = await requireAdmin();
  if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403);
  const parsed = z.object({ status: z.enum(["active", "disabled"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Status inválido.", 400);
  const { id } = await params;
  if (id === admin.id) return apiError("SELF_UPDATE", "Você não pode desativar sua própria conta.", 400);
  await connectDB();
  const user = await UserModel.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!user) return apiError("NOT_FOUND", "Usuário não encontrado.", 404);
  await AuditModel.create({ adminId: admin.id, targetUserId: id, action: `user.${parsed.data.status}` });
  return Response.json({ user: { id: user.id, status: user.status } });
}
