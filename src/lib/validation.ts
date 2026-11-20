import { z } from "zod";

export const credentialsSchema = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(8).max(72) });
export const registerSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(120) });
export const profileSchema = z.object({ name: z.string().trim().min(2).max(120).optional(), theme: z.enum(["light", "dark"]).optional() }).refine(v => Object.keys(v).length > 0);
export const deleteAccountSchema = z.object({ password: z.string().min(1) });
export const lessonSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(10).max(240),
  intro: z.string().trim().min(20).max(1000),
  tips: z.array(z.string().trim().min(5).max(500)).min(1).max(10),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  order: z.number().int().min(0).max(999),
});
