import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api/auth|api/signup|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
