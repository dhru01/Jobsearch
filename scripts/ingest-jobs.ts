import { runJobIngestion } from "@/lib/jobs/ingest";

const args = new Set(process.argv.slice(2));
const useFixtures = args.has("--fixtures");

async function main() {
  const result = await runJobIngestion({ useFixtures });
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
