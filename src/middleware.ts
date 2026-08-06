export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!api/auth|api/signup|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
