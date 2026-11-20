import type { DefaultSession } from "next-auth";
import type { Role, UserStatus } from "@/types";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; role: Role; status: UserStatus; theme: "light" | "dark" };
  }
  interface User { role: Role; status: UserStatus; theme: "light" | "dark" }
}

declare module "next-auth/jwt" {
  interface JWT { id: string; role: Role; status: UserStatus; theme: "light" | "dark" }
}
