import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { credentialsSchema } from "@/lib/validation";
import { UserModel } from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/entrar" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      await connectDB();
      const user = await UserModel.findOne({ email: parsed.data.email }).select("+passwordHash");
      if (!user || user.status !== "active" || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
      user.lastLoginAt = new Date(); await user.save();
      return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, theme: user.theme };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) Object.assign(token, { id: user.id, role: user.role, status: user.status, theme: user.theme });
      else if (token.id) {
        await connectDB();
        const current = await UserModel.findById(token.id).select("role status theme").lean();
        if (!current) token.status = "disabled";
        else Object.assign(token, { role: current.role, status: current.status, theme: current.theme });
      }
      return token;
    },
    async session({ session, token }) { Object.assign(session.user, { id: token.id, role: token.role, status: token.status, theme: token.theme }); return session; },
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/admin")) return session?.user.role === "admin" && session.user.status === "active";
      if (["/progresso", "/conta"].some(prefix => path.startsWith(prefix))) return session?.user.status === "active";
      return true;
    },
  },
});
