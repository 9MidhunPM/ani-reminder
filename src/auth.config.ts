import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") session.user.id = token.id;
      return session;
    },
    authorized({ auth: session, request }) {
      const isAuthenticated = Boolean(session?.user);
      const isAuthPage = ["/login", "/signup"].includes(request.nextUrl.pathname);
      if (isAuthPage && isAuthenticated) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      if (request.nextUrl.pathname !== "/" && !isAuthPage && !isAuthenticated) return false;
      return true;
    },
  },
} satisfies NextAuthConfig;
