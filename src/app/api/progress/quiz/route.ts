import { z } from "zod";
import { requireUser } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { QuizAttemptModel } from "@/models/Progress";

const answer = z.union([z.boolean(), z.literal("unsure")]);
const schema = z.object({
  score: z.number().int().min(0),
  total: z.number().int().positive(),
  currentIndex: z.number().int().min(0),
  answers: z.array(answer),
  completed: z.boolean(),
}).superRefine((value, context) => {
  if (value.score > value.currentIndex || value.currentIndex > value.total || value.answers.length !== value.currentIndex || value.completed !== (value.currentIndex === value.total)) {
    context.addIssue({ code: "custom", message: "Progresso do quiz inválido." });
  }
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return apiError("AUTH_REQUIRED", "Entre para continuar.", 401);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Progresso do quiz inválido.", 400);
  await connectDB();
  const { completed, ...progress } = parsed.data;
  const draft = await QuizAttemptModel.findOne({ userId: user.id, status: "in_progress" }).sort({ updatedAt: -1 });
  if (completed) {
    if (draft) {
      draft.set({ ...progress, status: "completed", completedAt: new Date() });
      await draft.save();
    } else {
      await QuizAttemptModel.create({ userId: user.id, ...progress, status: "completed", completedAt: new Date() });
    }
    return Response.json({ saved: true, completed: true });
  }
  if (draft) {
    draft.set(progress);
    await draft.save();
  } else {
    await QuizAttemptModel.create({ userId: user.id, ...progress, status: "in_progress" });
  }
  return Response.json({ saved: true, completed: false });
}
