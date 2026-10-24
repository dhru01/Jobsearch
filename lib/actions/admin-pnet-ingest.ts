"use server";

import { syncJobsAdmin, type SyncJobsState } from "@/lib/actions/admin-sync-jobs";

export type PnetFetchState = SyncJobsState;

/** @deprecated Use syncJobsAdmin — kept for compatibility. */
export async function fetchPnetJobsAdmin(prev: PnetFetchState, formData: FormData): Promise<PnetFetchState> {
  return syncJobsAdmin(prev, formData);
}
