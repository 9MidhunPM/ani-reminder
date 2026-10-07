import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";

export const metadata = { title: "Create your lineup", robots: { index: false, follow: true } };

export default function SignupPage() {
  return <AuthLayout mode="signup"><AuthForm mode="signup" /></AuthLayout>;
}
