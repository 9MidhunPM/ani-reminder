import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";

export default function LoginPage() {
  return <AuthLayout mode="login"><AuthForm mode="login" /></AuthLayout>;
}
