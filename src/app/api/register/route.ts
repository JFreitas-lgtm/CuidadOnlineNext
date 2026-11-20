import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { registerSchema } from "@/lib/validation";
import { UserModel } from "@/models/User";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Confira os campos informados.", 400, parsed.error.flatten().fieldErrors);
  await connectDB();
  if (await UserModel.exists({ email: parsed.data.email })) return apiError("EMAIL_IN_USE", "Este e-mail já está cadastrado.", 409);
  const user = await UserModel.create({ ...parsed.data, password: undefined, passwordHash: await bcrypt.hash(parsed.data.password, 12) });
  return Response.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
}
