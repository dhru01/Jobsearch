import type { QualificationLevel } from "@/lib/matching/score";

export type WorkMode = "remote" | "hybrid" | "on_site";

export type RawListing = {
  source: string;
  sourceId: string;
  originalUrl: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  locationText: string;
  postedAt: Date | null;
  employmentType?: string | null;
  salaryText?: string | null;
  raw: Record<string, unknown>;
};

export type NormalizedJob = {
  source: string;
  source_id: string;
  original_url: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  location: string;
  province: string | null;
  city: string | null;
  work_mode: WorkMode;
  posted_at: string | null;
  last_verified_at: string;
  min_qualification: QualificationLevel | null;
  min_years_experience: number | null;
  skills: string[];
  is_stale: boolean;
  fingerprint: string;
  employment_type: string | null;
  salary_text: string | null;
  salary_min: number | null;
  raw: Record<string, unknown>;
};

export type IngestionResult = {
  runId: string;
  fetched: number;
  inserted: number;
  updated: number;
  skippedDuplicate: number;
  skippedNotRelevant?: number;
  skippedNotSouthAfrica?: number;
  staleMarked: number;
  rescoredUsers: number;
  sourceCounts: Record<string, number>;
  errors: string[];
  pnetSearch?: { keyword: string; location: string };
  apifySearch?: { keyword: string; location: string };
  sourcesRun?: string[];
};
