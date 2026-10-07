import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";

export default function SignupPage() {
  return <AuthLayout mode="signup"><AuthForm mode="signup" /></AuthLayout>;
}
