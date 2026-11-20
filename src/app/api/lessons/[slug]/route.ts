import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/access";
import { getLesson } from "@/lib/content";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { lessonSchema } from "@/lib/validation";
import { LessonModel } from "@/models/Lesson";
import { QuestionModel, GlossaryModel } from "@/models/Content";
import { ProgressModel, AuditModel } from "@/models/Progress";

type Context = { params: Promise<{ slug: string }> };
export async function GET(_: Request, { params }: Context) { const item = await getLesson((await params).slug); return item ? Response.json({ lesson: item }) : apiError("NOT_FOUND", "Aula não encontrada.", 404); }
export async function PATCH(request: Request, { params }: Context) {
  const admin = await requireAdmin(); if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403);
  const oldSlug = (await params).slug; const parsed = lessonSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Confira os campos.", 400, parsed.error.flatten().fieldErrors);
  await connectDB(); const lesson = await LessonModel.findOneAndUpdate({ slug: oldSlug }, parsed.data, { new: true, runValidators: true });
  if (!lesson) return apiError("NOT_FOUND", "Aula não encontrada.", 404);
  if (oldSlug !== lesson.slug) await Promise.all([QuestionModel.updateMany({ lessonSlug: oldSlug }, { lessonSlug: lesson.slug }), GlossaryModel.updateMany({ lessonSlug: oldSlug }, { lessonSlug: lesson.slug }), ProgressModel.updateMany({ "lessons.slug": oldSlug }, { $set: { "lessons.$[item].slug": lesson.slug } }, { arrayFilters: [{ "item.slug": oldSlug }] })]);
  await AuditModel.create({ adminId: admin.id, action: "lesson.updated", details: { oldSlug, slug: lesson.slug } }); revalidateTag("lessons", "max"); revalidatePath(`/aprender/${oldSlug}`);
  return Response.json({ lesson });
}
export async function DELETE(_: Request, { params }: Context) {
  const admin = await requireAdmin(); if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403);
  const { slug } = await params; await connectDB(); const lesson = await LessonModel.findOneAndDelete({ slug });
  if (!lesson) return apiError("NOT_FOUND", "Aula não encontrada.", 404);
  await Promise.all([QuestionModel.deleteMany({ lessonSlug: slug }), GlossaryModel.deleteMany({ lessonSlug: slug }), ProgressModel.updateMany({}, { $pull: { lessons: { slug } } }), AuditModel.create({ adminId: admin.id, action: "lesson.deleted", details: { slug } })]);
  revalidateTag("lessons", "max"); revalidatePath(`/aprender/${slug}`); return new Response(null, { status: 204 });
}
