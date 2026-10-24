export const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site" },
] as const;

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  draft: "Draft documents",
  prepared: "Documents ready",
  opened: "Posting opened",
  queued: "Queued",
  preparing: "Preparing",
  awaiting_approval: "Awaiting approval",
  applying: "Applying",
  unverified: "Submitted (unverified)",
  submitted: "Submitted",
  failed: "Failed",
  action_required: "Action required",
  interview: "Interview",
  rejected: "Rejected",
  offer: "Offer received",
  withdrawn: "Withdrawn",
};

const APPLICATION_EVENT_LABELS: Record<string, string> = {
  saved: "Role saved",
  documents_generated: "Tailored documents generated",
  documents_reviewed: "Documents reviewed",
  posting_opened: "Employer posting opened",
  submission_reported: "You reported a submission",
  withdrawn: "Application withdrawn",
  queued: "Queued for apply worker",
  awaiting_approval: "Awaiting your approval",
  answers_generated: "Application answers drafted",
  approved: "You approved this application",
  submitted: "Submitted with evidence",
  failed: "Apply attempt failed",
  status_updated: "Status updated",
};

export function workModeLabel(value: string) {
  return WORK_MODES.find((mode) => mode.value === value)?.label ?? value;
}

export function applicationStatusLabel(status: string) {
  return APPLICATION_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function applicationEventLabel(eventType: string) {
  return APPLICATION_EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

const JOB_SOURCE_LABELS: Record<string, string> = {
  pnet: "Listing",
  indeed: "Listing",
  linkedin: "Listing",
  serpapi: "Google Jobs",
  greenhouse: "Greenhouse",
  synthetic: "Sample",
  fixtures: "Sample",
};

export function jobSourceLabel(source: string) {
  return JOB_SOURCE_LABELS[source] ?? source;
}

/** Display scores as whole numbers on a 5-point scale (rounded up, max 100). */
export function roundScoreDisplay(score: number) {
  if (!Number.isFinite(score)) return 0;
  const clamped = Math.max(0, Math.min(100, score));
  return Math.min(100, Math.ceil(clamped / 5) * 5);
}

export function formatScore(score: number) {
  return String(roundScoreDisplay(score));
}

export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
