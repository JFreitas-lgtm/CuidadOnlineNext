import { requireUser } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { LessonModel } from "@/models/Lesson";
import { ProgressModel } from "@/models/Progress";
type Context = { params: Promise<{ slug: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const user = await requireUser(); if (!user) return apiError("AUTH_REQUIRED", "Entre para continuar.", 401);
  const { slug } = await params; const body = await request.json().catch(() => ({})); await connectDB();
  if (!(await LessonModel.exists({ slug }))) return apiError("NOT_FOUND", "Aula não encontrada.", 404);
  let record = await ProgressModel.findOne({ userId: user.id }); if (!record) record = await ProgressModel.create({ userId: user.id, lessons: [] });
  let lesson = record.lessons.find((x: { slug: string }) => x.slug === slug); if (!lesson) { record.lessons.push({ slug, visitedAt: new Date(), favorite: false }); lesson = record.lessons.at(-1); }
  lesson.visitedAt = new Date(); record.lastLesson = slug;
  if (typeof body.favorite === "boolean") lesson.favorite = body.favorite;
  if (body.completed === true) lesson.completedAt ??= new Date();
  await record.save(); return Response.json({ saved: true });
}
