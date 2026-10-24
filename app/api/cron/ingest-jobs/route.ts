import { runJobIngestion } from "@/lib/jobs/ingest-server";

export async function GET(request: Request) {
  const secret = process.env.INGEST_CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "INGEST_CRON_SECRET is not configured." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runJobIngestion();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
