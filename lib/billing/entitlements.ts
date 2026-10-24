import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserSubscription, planDetails } from "@/lib/billing/subscription";

function startOfMonthUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function countTailoredGenerationsThisMonth(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("application_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "documents_generated")
    .gte("created_at", startOfMonthUtc());

  if (error) throw error;
  return count ?? 0;
}

export async function canGenerateTailoredDocuments(supabase: SupabaseClient, userId: string) {
  const subscription = await getUserSubscription(supabase, userId);
  const limit = planDetails(subscription.plan).tailoredGenerationsPerMonth;
  if (limit == null) {
    return { allowed: true, remaining: null as number | null, plan: subscription.plan };
  }

  const used = await countTailoredGenerationsThisMonth(supabase, userId);
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining, plan: subscription.plan, limit, used };
}

export async function canReceiveDailyDigest(supabase: SupabaseClient, userId: string) {
  const subscription = await getUserSubscription(supabase, userId);
  return planDetails(subscription.plan).dailyDigest;
}
