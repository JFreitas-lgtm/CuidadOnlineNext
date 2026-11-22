import { requireAdmin } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { UserModel } from "@/models/User";
import { LessonModel } from "@/models/Lesson";
import { ProgressModel, QuizAttemptModel, SimulationAttemptModel } from "@/models/Progress";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return apiError("ADMIN_REQUIRED", "Acesso exclusivo para administradores.", 403);
  await connectDB();
  const now = Date.now();
  const since7Days = new Date(now - 7 * 86_400_000);
  const since30Days = new Date(now - 30 * 86_400_000);
  const completedQuiz = { $or: [{ status: "completed" }, { status: { $exists: false } }] };
  const [users, activeUsers, lessons, quizzes, simulations, new7Days, new30Days, progressStats, quizStats, popularLessons, progressUsers, quizUsers, simulationUsers] = await Promise.all([
    UserModel.countDocuments(), UserModel.countDocuments({ status: "active" }), LessonModel.countDocuments(), QuizAttemptModel.countDocuments(completedQuiz), SimulationAttemptModel.countDocuments(),
    UserModel.countDocuments({ createdAt: { $gte: since7Days } }), UserModel.countDocuments({ createdAt: { $gte: since30Days } }),
    ProgressModel.aggregate([{ $project: { completed: { $size: { $filter: { input: "$lessons", as: "lesson", cond: { $ne: ["$$lesson.completedAt", null] } } } } } }, { $group: { _id: null, total: { $sum: "$completed" } } }]),
    QuizAttemptModel.aggregate([{ $match: { total: { $gt: 0 }, ...completedQuiz } }, { $project: { percent: { $multiply: [{ $divide: ["$score", "$total"] }, 100] } } }, { $group: { _id: null, average: { $avg: "$percent" } } }]),
    ProgressModel.aggregate([{ $unwind: "$lessons" }, { $group: { _id: "$lessons.slug", visits: { $sum: 1 } } }, { $sort: { visits: -1 } }, { $limit: 5 }]),
    ProgressModel.distinct("userId"), QuizAttemptModel.distinct("userId"), SimulationAttemptModel.distinct("userId"),
  ]);
  const usersWithActivity = new Set([...progressUsers, ...quizUsers, ...simulationUsers].map(String)).size;
  return Response.json({
    users, activeUsers, disabledUsers: users - activeUsers, lessons, quizzes, simulations,
    new7Days, new30Days, lessonsCompleted: progressStats[0]?.total ?? 0,
    averageQuizPercent: Math.round(quizStats[0]?.average ?? 0), usersWithActivity,
    popularLessons: popularLessons.map(item => ({ slug: item._id, visits: item.visits })),
  });
}
