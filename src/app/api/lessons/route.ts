import { revalidateTag } from "next/cache";
import { getLessons } from "@/lib/content";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/access";
import { apiError } from "@/lib/utils";
import { lessonSchema } from "@/lib/validation";
import { LessonModel } from "@/models/Lesson";
import { AuditModel } from "@/models/Progress";

export async function GET() { return Response.json({ lessons: await getLessons() }); }
export async function POST(request: Request) {
  const admin = await requireAdmin(); if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403);
  const parsed = lessonSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Confira os campos.", 400, parsed.error.flatten().fieldErrors);
  await connectDB();
  if (await LessonModel.exists({ slug: parsed.data.slug })) return apiError("SLUG_IN_USE", "Já existe uma aula com este endereço.", 409);
  const lesson = await LessonModel.create(parsed.data); await AuditModel.create({ adminId: admin.id, action: "lesson.created", details: { slug: lesson.slug } });
  revalidateTag("lessons", "max"); return Response.json({ lesson }, { status: 201 });
}
