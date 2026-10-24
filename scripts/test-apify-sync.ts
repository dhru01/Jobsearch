import { runApifyJobSync } from "@/lib/jobs/ingest-apify";

async function main() {
  const result = await runApifyJobSync({
    skipRescore: true,
    searchOverride: { keyword: "graduate", location: "Johannesburg" },
  });
  console.log(
    JSON.stringify(
      {
        sourcesRun: result.sourcesRun,
        fetched: result.fetched,
        inserted: result.inserted,
        updated: result.updated,
        skippedDuplicate: result.skippedDuplicate,
        skippedNotSA: result.skippedNotSouthAfrica,
        sourceCounts: result.sourceCounts,
        errors: result.errors,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
