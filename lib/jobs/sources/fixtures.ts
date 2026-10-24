import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RawListing } from "@/lib/jobs/types";

export async function fetchFixtureListings(fixturePath?: string) {
  const file =
    fixturePath ??
    path.join(process.cwd(), "fixtures", "ingested-jobs.sample.json");
  const raw = await readFile(/* turbopackIgnore: true */ file, "utf8");
  const parsed = JSON.parse(raw) as RawListing[];
  return parsed.map((item) => ({
    ...item,
    postedAt: item.postedAt ? new Date(item.postedAt as string | Date) : null,
  }));
}
