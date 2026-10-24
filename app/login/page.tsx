import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { SignInForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" lede="Pick up your confirmed profile, matches, and saved applications.">
      <SignInForm />
    </AuthCard>
  );
}
