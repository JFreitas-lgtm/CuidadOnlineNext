import { z } from "zod";
import { requireUser } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { SimulationModel } from "@/models/Content";
import { SimulationAttemptModel } from "@/models/Progress";
const schema = z.object({ simulationSlug: z.string(), outcome: z.enum(["safe", "risk", "completed"]) });
export async function POST(request: Request) { const user = await requireUser(); if (!user) return apiError("AUTH_REQUIRED", "Entre para continuar.", 401); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("VALIDATION_ERROR", "Resultado inválido.", 400); await connectDB(); if (!(await SimulationModel.exists({ slug: parsed.data.simulationSlug }))) return apiError("NOT_FOUND", "Simulação não encontrada.", 404); await SimulationAttemptModel.create({ userId: user.id, ...parsed.data }); return Response.json({ saved: true }, { status: 201 }); }
