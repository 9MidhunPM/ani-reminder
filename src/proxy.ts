import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);
export const proxy = auth(function proxy() {});

export const config = {
  matcher: ["/((?!api/auth|api/signup|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
