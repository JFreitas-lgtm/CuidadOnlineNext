import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/utils";
import { LessonModel } from "@/models/Lesson";
import { QuestionModel, SimulationModel, GlossaryModel, HelpModel } from "@/models/Content";
import type { Lesson, QuizQuestion, Simulation } from "@/types";

export const getLessons = unstable_cache(async (): Promise<Lesson[]> => {
  await connectDB(); const rows = await LessonModel.find().sort({ order: 1 }).lean();
  return serialize(rows.map(r => ({ ...r, id: String(r._id) }))) as unknown as Lesson[];
}, ["lessons"], { tags: ["lessons"], revalidate: 300 });

export const getLesson = async (slug: string): Promise<Lesson | null> => {
  await connectDB(); const row = await LessonModel.findOne({ slug }).lean();
  return row ? serialize({ ...row, id: String(row._id) }) as unknown as Lesson : null;
};
export async function getQuestions(): Promise<QuizQuestion[]> { await connectDB(); return serialize(await QuestionModel.find().sort({ order: 1 }).lean().then(rows => rows.map(r => ({ ...r, id: String(r._id) })))) as unknown as QuizQuestion[]; }
export async function getSimulations(): Promise<Simulation[]> { await connectDB(); return serialize(await SimulationModel.find().sort({ order: 1 }).lean().then(rows => rows.map(r => ({ ...r, id: String(r._id) })))) as unknown as Simulation[]; }
export async function getGlossary() { await connectDB(); return serialize(await GlossaryModel.find().sort({ term: 1 }).lean()); }
export async function getHelp() { await connectDB(); return serialize(await HelpModel.find().sort({ order: 1 }).lean()); }
