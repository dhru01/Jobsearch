import {
  buildRequirements,
  inferMinQualification,
  inferMinYears,
  inferSkills,
  inferWorkMode,
  isPostingStale,
} from "@/lib/jobs/extract";
import { jobFingerprint } from "@/lib/jobs/dedupe";
import { isSouthAfricanListing, normalizeSouthAfricanLocation } from "@/lib/jobs/location";
import { normalizeEmploymentType, parseSalaryMinZar } from "@/lib/jobs/salary-parse";
import type { NormalizedJob, RawListing } from "@/lib/jobs/types";

export function normalizeListing(listing: RawListing, verifiedAt = new Date()): NormalizedJob | null {
  const combined = `${listing.description}\n${listing.requirements}`;
  if (!isSouthAfricanListing(listing.locationText, combined)) return null;

  const { location, city, province } = normalizeSouthAfricanLocation(listing.locationText);
  const work_mode = inferWorkMode(`${listing.locationText}\n${combined}`);
  const text = `${listing.title}\n${combined}`;
  const min_qualification = inferMinQualification(text);
  const min_years_experience = inferMinYears(text);
  const skills = inferSkills(text);
  const highlightItems = Array.isArray(listing.raw.highlights)
    ? (listing.raw.highlights as string[])
    : undefined;
  const requirements =
    listing.requirements.trim() || buildRequirements(listing.description, highlightItems);

  const fingerprint = jobFingerprint({ company: listing.company, title: listing.title, city });
  const posted_at = listing.postedAt ? listing.postedAt.toISOString() : null;
  const salary_text = listing.salaryText?.trim() || null;
  const employment_type = normalizeEmploymentType(listing.employmentType);
  const salary_min = parseSalaryMinZar(salary_text);

  return {
    source: listing.source,
    source_id: listing.sourceId,
    original_url: listing.originalUrl,
    title: listing.title.trim(),
    company: listing.company.trim(),
    description: listing.description.trim(),
    requirements,
    location,
    province,
    city,
    work_mode,
    posted_at,
    last_verified_at: verifiedAt.toISOString(),
    min_qualification,
    min_years_experience,
    skills,
    is_stale: isPostingStale(listing.postedAt, verifiedAt),
    fingerprint,
    employment_type,
    salary_text,
    salary_min,
    raw: listing.raw,
  };
}
