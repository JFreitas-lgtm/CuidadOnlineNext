import { Schema, model, models } from "mongoose";
const lessonSchema = new Schema({
  slug: { type: String, required: true, unique: true, index: true }, title: { type: String, required: true },
  summary: { type: String, required: true }, intro: { type: String, required: true }, tips: { type: [String], required: true },
  color: { type: String, required: true }, background: { type: String, required: true }, order: { type: Number, default: 0, index: true },
}, { timestamps: true });
export const LessonModel = models.Lesson ?? model("Lesson", lessonSchema);
