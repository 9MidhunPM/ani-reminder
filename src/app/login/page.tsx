import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";

export const metadata = { title: "Sign in", robots: { index: false, follow: true } };

export default function LoginPage() {
  return <AuthLayout mode="login"><AuthForm mode="login" /></AuthLayout>;
}
