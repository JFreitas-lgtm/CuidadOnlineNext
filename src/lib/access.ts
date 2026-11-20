import { auth } from "@/auth";
export async function requireUser() { const session = await auth(); return session?.user.status === "active" ? session.user : null; }
export async function requireAdmin() { const user = await requireUser(); return user?.role === "admin" ? user : null; }
