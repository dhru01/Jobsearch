import { ApifyClient } from "apify-client";

export class ApifyNotConfiguredError extends Error {
  constructor(detail?: string) {
    super(detail ?? "Set APIFY_API_TOKEN and the actor ID for this source in .env.local.");
    this.name = "ApifyNotConfiguredError";
  }
}

export function apifyToken(): string {
  const token = process.env.APIFY_API_TOKEN?.trim();
  if (!token) throw new ApifyNotConfiguredError();
  return token;
}

export function createApifyClient() {
  return new ApifyClient({ token: apifyToken() });
}

export async function runApifyActor<TItem = Record<string, unknown>>(options: {
  actorId: string;
  input: Record<string, unknown>;
  label: string;
  waitSecs?: number;
}): Promise<{ items: TItem[]; runId: string; datasetId: string }> {
  const client = createApifyClient();
  const actorId = options.actorId.trim();
  if (!actorId) throw new ApifyNotConfiguredError(`${options.label}: actor ID is missing.`);

  console.info(`[apify] starting ${options.label}`, { actorId });

  const run = await client.actor(actorId).call(options.input, {
    waitSecs: options.waitSecs ?? 300,
  });

  const datasetId = run.defaultDatasetId;
  if (!datasetId) {
    throw new Error(`Apify run for ${options.label} finished without a default dataset.`);
  }

  const { items } = await client.dataset(datasetId).listItems();
  console.info(`[apify] finished ${options.label}`, {
    runId: run.id,
    datasetId,
    itemCount: items.length,
  });

  return { items: items as TItem[], runId: run.id, datasetId };
}
