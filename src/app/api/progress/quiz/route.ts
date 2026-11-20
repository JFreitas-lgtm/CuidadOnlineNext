import { z } from "zod";
import { requireUser } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { QuizAttemptModel } from "@/models/Progress";
const schema = z.object({ score: z.number().int().min(0), total: z.number().int().positive(), answers: z.array(z.union([z.boolean(), z.literal("unsure")])) }).refine(v => v.score <= v.total && v.answers.length === v.total);
export async function POST(request: Request) { const user = await requireUser(); if (!user) return apiError("AUTH_REQUIRED", "Entre para continuar.", 401); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("VALIDATION_ERROR", "Resultado inválido.", 400); await connectDB(); await QuizAttemptModel.create({ userId: user.id, ...parsed.data }); return Response.json({ saved: true }, { status: 201 }); }
