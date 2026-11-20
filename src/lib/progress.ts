import { connectDB } from "@/lib/db";
import { ProgressModel, QuizAttemptModel, SimulationAttemptModel } from "@/models/Progress";
import type { Progress } from "@/types";

export async function readProgress(userId: string): Promise<Progress> {
  await connectDB(); const [record, quizzes, simulationAttempts] = await Promise.all([
    ProgressModel.findOne({ userId }).lean(), QuizAttemptModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(), SimulationAttemptModel.countDocuments({ userId }),
  ]);
  const lessons = (record?.lessons ?? []) as Array<{ slug: string; completedAt?: Date; favorite?: boolean }>; let best: { score: number; total: number } | null = null;
  for (const q of quizzes) if (!best || q.score / q.total > best.score / best.total) best = { score: q.score, total: q.total };
  return { completed: lessons.filter(x => x.completedAt).map(x => x.slug), favorites: lessons.filter(x => x.favorite).map(x => x.slug), lastLesson: record?.lastLesson ?? null, quizAttempts: quizzes.length, simulationAttempts, bestQuiz: best };
}
