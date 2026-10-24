export type MatchJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  original_url: string;
  work_mode: string;
  is_stale: boolean;
  source: string;
  employment_type: string | null;
  salary_text: string | null;
  salary_min: number | null;
};

export type MatchRow = {
  match: {
    id: string;
    score: number | string;
    eligibility_pass: boolean;
    eligibility_reasons: string[] | null;
    breakdown: Record<string, unknown> | null;
  };
  job: MatchJob;
};
