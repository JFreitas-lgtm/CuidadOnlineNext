import { requireAdmin } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { UserModel } from "@/models/User";
import { LessonModel } from "@/models/Lesson";
import { QuizAttemptModel, SimulationAttemptModel } from "@/models/Progress";
export async function GET() { const admin = await requireAdmin(); if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403); await connectDB(); const [users, activeUsers, lessons, quizzes, simulations] = await Promise.all([UserModel.countDocuments(), UserModel.countDocuments({ status: "active" }), LessonModel.countDocuments(), QuizAttemptModel.countDocuments(), SimulationAttemptModel.countDocuments()]); return Response.json({ users, activeUsers, lessons, quizzes, simulations }); }
