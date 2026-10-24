import { runDailyDigest } from "@/lib/email/run-daily-digest";

export async function GET(request: Request) {
  const secret = process.env.DIGEST_CRON_SECRET ?? process.env.INGEST_CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "DIGEST_CRON_SECRET is not configured." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runDailyDigest();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Digest failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
