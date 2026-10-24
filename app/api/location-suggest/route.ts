import { suggestLocations } from "@/lib/jobs/location-autocomplete";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const limitRaw = Number(searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 15) : 10;

  const suggestions = await suggestLocations(q, limit);
  return Response.json({ suggestions });
}
