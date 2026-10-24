import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function runMockPlaywrightApplication(applicationId: string) {
  const supabase = createServiceRoleClient();
  const { data: application, error } = await supabase
    .from("applications")
    .select("id, user_id, answers_json, jobs(title, original_url)")
    .eq("id", applicationId)
    .maybeSingle();
  if (error || !application) throw new Error("Application not found.");

  await supabase.from("applications").update({ status: "applying" }).eq("id", applicationId);
  await supabase
    .from("application_queue")
    .update({ status: "running", attempts: 1 })
    .eq("application_id", applicationId);

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("full_name, email, phone")
    .eq("user_id", application.user_id)
    .maybeSingle();

  const answers = (application.answers_json as { answers?: { question: string; value: string }[] } | null)?.answers ?? [];
  const find = (needle: string) =>
    answers.find((item) => item.question.toLowerCase().includes(needle))?.value ?? "";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const mockUrl = `${siteUrl}/apply/mock`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(mockUrl, { waitUntil: "networkidle" });
    await page.fill("#full_name", profile?.full_name || find("full name") || "Test Candidate");
    await page.fill("#email", profile?.email || find("email") || "test@example.com");
    await page.fill("#phone", profile?.phone || find("phone") || "");
    await page.fill("#salary", find("salary"));
    await page.fill("#why", find("interested") || find("why") || "Applying from my confirmed Fieldwork profile.");

    const { data: cvDoc } = await supabase
      .from("documents")
      .select("storage_path, file_name")
      .eq("user_id", application.user_id)
      .eq("kind", "cv")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cvDoc?.storage_path) {
      const { data: file } = await supabase.storage.from("cvs").download(cvDoc.storage_path as string);
      if (file) {
        const dir = join(tmpdir(), "fieldwork-apply");
        await mkdir(dir, { recursive: true });
        const path = join(dir, String(cvDoc.file_name ?? "cv.pdf"));
        await writeFile(path, Buffer.from(await file.arrayBuffer()));
        await page.setInputFiles("#cv", path);
      }
    }

    await page.click("button[type=submit]");
    await page.waitForSelector("#confirmation", { timeout: 10_000 });
    const confirmation = await page.locator("#confirmation").innerText();

    await supabase
      .from("applications")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        error_message: null,
        notes: confirmation,
      })
      .eq("id", applicationId);

    await supabase.from("application_queue").update({ status: "done", last_error: null }).eq("application_id", applicationId);
    await supabase.from("application_events").insert({
      application_id: applicationId,
      user_id: application.user_id,
      event_type: "submitted",
      payload: { workflow: "mock", confirmation },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase.from("applications").update({ status: "failed", error_message: message }).eq("id", applicationId);
    await supabase.from("application_queue").update({ status: "failed", last_error: message }).eq("application_id", applicationId);
    await supabase.from("application_events").insert({
      application_id: applicationId,
      user_id: application.user_id,
      event_type: "failed",
      payload: { workflow: "mock", error: message },
    });
    throw error;
  } finally {
    await browser.close();
  }
}
