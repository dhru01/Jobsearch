import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, type PlanId } from "@/lib/billing/plans";

export type UserSubscription = {
  plan: PlanId;
  status: "active" | "past_due" | "canceled";
  currentPeriodEnd: Date | null;
};

export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const plan = data?.plan === "pro" ? "pro" : "free";
  const status =
    data?.status === "past_due" || data?.status === "canceled" ? data.status : "active";

  let effectivePlan: PlanId = plan;
  if (plan === "pro" && status !== "active") {
    effectivePlan = "free";
  }
  if (plan === "pro" && data?.current_period_end) {
    const end = new Date(data.current_period_end);
    if (end.getTime() < Date.now()) {
      effectivePlan = "free";
    }
  }

  return {
    plan: effectivePlan,
    status,
    currentPeriodEnd: data?.current_period_end ? new Date(data.current_period_end) : null,
  };
}

export function planDetails(planId: PlanId) {
  return PLANS[planId];
}
