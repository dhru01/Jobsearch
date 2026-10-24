import { enqueueEligibleMatches } from "@/lib/apply/enqueue";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: Request) {
  const secret = process.env.APPLY_WORKER_SECRET ?? process.env.INGEST_CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "APPLY_WORKER_SECRET is not configured." }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: profiles, error } = await supabase
    .from("candidate_profiles")
    .select("user_id")
    .eq("extraction_status", "confirmed");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const totals = { queued: 0, awaiting: 0, skipped: 0, users: 0 };
  for (const row of profiles ?? []) {
    const result = await enqueueEligibleMatches(supabase, row.user_id as string);
    totals.queued += result.queued;
    totals.awaiting += result.awaiting;
    totals.skipped += result.skipped;
    totals.users += 1;
  }

  return Response.json({
    ...totals,
    applyLive: process.env.APPLY_LIVE === "true",
    note: "Queue only. Playwright does not run in this serverless route. Live PNet/LinkedIn/Indeed submit is off.",
  });
}
