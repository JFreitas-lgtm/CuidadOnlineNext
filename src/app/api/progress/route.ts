import { requireUser } from "@/lib/access";
import { apiError } from "@/lib/utils";
import { readProgress } from "@/lib/progress";
import { connectDB } from "@/lib/db";
import { ProgressModel, QuizAttemptModel, SimulationAttemptModel } from "@/models/Progress";
export async function GET() { const user = await requireUser(); return user ? Response.json(await readProgress(user.id)) : apiError("AUTH_REQUIRED", "Entre para continuar.", 401); }
export async function DELETE() { const user = await requireUser(); if (!user) return apiError("AUTH_REQUIRED", "Entre para continuar.", 401); await connectDB(); await Promise.all([ProgressModel.deleteOne({ userId: user.id }), QuizAttemptModel.deleteMany({ userId: user.id }), SimulationAttemptModel.deleteMany({ userId: user.id })]); return new Response(null, { status: 204 }); }
