import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { runMockPlaywrightApplication } from "@/lib/apply/playwright-mock";

async function main() {
  if (process.env.APPLY_LIVE === "true") {
    console.error("APPLY_LIVE is true. Refusing to run until you disable it or implement a permitted live workflow.");
    process.exit(1);
  }

  const onlyId = process.argv.find((arg) => arg.startsWith("--application-id="))?.split("=")[1];
  const supabase = createServiceRoleClient();

  if (onlyId) {
    await runMockPlaywrightApplication(onlyId);
    console.log(JSON.stringify({ applicationId: onlyId, ok: true }));
    return;
  }

  const { data: jobs } = await supabase
    .from("application_queue")
    .select("application_id, applications(workflow)")
    .eq("status", "pending")
    .limit(5);

  const results: { applicationId: string; ok: boolean; error?: string }[] = [];
  for (const row of jobs ?? []) {
    const workflow = Array.isArray(row.applications) ? row.applications[0]?.workflow : (row.applications as { workflow?: string } | null)?.workflow;
    if (workflow !== "mock") {
      results.push({ applicationId: row.application_id as string, ok: false, error: "Not a mock workflow; skipped." });
      continue;
    }
    try {
      await runMockPlaywrightApplication(row.application_id as string);
      results.push({ applicationId: row.application_id as string, ok: true });
    } catch (error) {
      results.push({
        applicationId: row.application_id as string,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(JSON.stringify({ processed: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
