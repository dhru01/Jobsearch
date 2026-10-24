import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { SignUpForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      lede="For South African graduates and early-career professionals. You confirm every fact before it is used."
    >
      <SignUpForm />
    </AuthCard>
  );
}
