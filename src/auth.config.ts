import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
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
        return Response.redirect(new URL("/", request.nextUrl));
      }
      if (!isAuthPage && !isAuthenticated) return false;
      return true;
    },
  },
} satisfies NextAuthConfig;
