import { Schema, model, models } from "mongoose";
const questionSchema = new Schema({ lessonSlug: { type: String, required: true, index: true }, sender: String, message: String, scam: Boolean, explanation: String, order: Number }, { timestamps: true });
const simulationSchema = new Schema({ slug: { type: String, unique: true, index: true }, title: String, description: String, kind: { type: String, enum: ["conversation", "inspection"] }, data: Schema.Types.Mixed, order: Number }, { timestamps: true });
const glossarySchema = new Schema({ term: { type: String, unique: true }, definition: String, lessonSlug: { type: String, index: true } }, { timestamps: true });
const helpSchema = new Schema({ slug: { type: String, unique: true }, title: String, description: String, steps: [String], order: Number }, { timestamps: true });
export const QuestionModel = models.Question ?? model("Question", questionSchema);
export const SimulationModel = models.Simulation ?? model("Simulation", simulationSchema);
export const GlossaryModel = models.Glossary ?? model("Glossary", glossarySchema);
export const HelpModel = models.Help ?? model("Help", helpSchema);
