"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { initializeProCheckout, PaystackNotConfiguredError } from "@/lib/billing/paystack";
import { getUserSubscription } from "@/lib/billing/subscription";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type BillingState = { error: string | null };

export async function startProCheckout(): Promise<never> {
  const { supabase, user } = await requireUser();
  const subscription = await getUserSubscription(supabase, user.id);
  if (subscription.plan === "pro") {
    redirect("/dashboard/plan?already=pro");
  }

  const email = user.email;
  if (!email) {
    redirect("/dashboard/plan?error=email");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const checkout = await initializeProCheckout({
      email,
      userId: user.id,
      callbackUrl: `${siteUrl}/dashboard/plan?paid=1`,
    });
    redirect(checkout.authorizationUrl);
  } catch (error) {
    if (error instanceof PaystackNotConfiguredError) {
      redirect("/dashboard/plan?error=paystack");
    }
    console.error("Checkout failed", error);
    redirect("/dashboard/plan?error=checkout");
  }
}

/** Local development only — simulates a successful Pro payment. */
export async function devActivatePro() {
  if (process.env.BILLING_DEV_UPGRADE !== "true") {
    redirect("/dashboard/plan?error=checkout");
  }

  const { user } = await requireUser();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: "pro",
      status: "active",
      provider: "dev",
      current_period_end: periodEnd.toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Dev pro upgrade failed", error.message);
    redirect("/dashboard/plan?error=checkout");
  }

  revalidatePath("/dashboard/plan");
  revalidatePath("/dashboard/profile");
  redirect("/dashboard/plan?paid=1");
}
