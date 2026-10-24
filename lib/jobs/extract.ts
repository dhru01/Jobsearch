import { QUALIFICATION_LEVELS, type QualificationLevel } from "@/lib/matching/score";
import type { WorkMode } from "@/lib/jobs/types";

const SKILL_HINTS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "Excel",
  "Git",
  "HTML",
  "CSS",
  "Figma",
  "AWS",
  "Docker",
  "Linux",
  "Communication",
  "Accounting",
  "Statistics",
  "User research",
  "Prototyping",
  "SEO",
  "CRM",
  "AutoCAD",
  "GIS",
  "Kubernetes",
  "Go",
  "Pastel",
  "Canva",
  "Analytics",
  "Writing",
  "Research",
  "Networking",
  "Security",
  "Civil engineering",
  "Mechanical engineering",
  "Environmental science",
  "Report writing",
  "Copywriting",
  "Social media",
  "HR",
  "Node.js",
];

const QUAL_PATTERNS: { level: QualificationLevel; pattern: RegExp }[] = [
  { level: "doctorate", pattern: /\b(ph\.?d|doctorate)\b/i },
  { level: "masters", pattern: /\b(master'?s?|msc|m\.?com)\b/i },
  { level: "honours", pattern: /\b(honou?rs?)\b/i },
  { level: "bachelors", pattern: /\b(bachelor'?s?|bsc|bcom|b\.?eng|degree)\b/i },
  { level: "diploma", pattern: /\b(diploma)\b/i },
  { level: "certificate", pattern: /\b(certificate|n[456])\b/i },
  { level: "matric", pattern: /\b(matric|grade 12)\b/i },
];

export function inferWorkMode(text: string): WorkMode {
  const lower = text.toLowerCase();
  if (/\b(remote|work from home|wfh)\b/.test(lower)) return "remote";
  if (/\b(hybrid|partially remote)\b/.test(lower)) return "hybrid";
  if (/\b(on[- ]site|office[- ]based)\b/.test(lower)) return "on_site";
  return "on_site";
}

export function inferMinQualification(text: string): QualificationLevel | null {
  let best: QualificationLevel | null = null;
  let bestIndex = -1;
  for (const item of QUAL_PATTERNS) {
    if (!item.pattern.test(text)) continue;
    const index = QUALIFICATION_LEVELS.indexOf(item.level);
    if (index > bestIndex) {
      bestIndex = index;
      best = item.level;
    }
  }
  return best;
}

export function inferMinYears(text: string): number | null {
  const patterns = [
    /(?:minimum|at least|min\.?)\s+(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
    /(\d+)\s*\+\s*years?/i,
  ];
  let max: number | null = null;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const years = Number(match[1]);
    if (!Number.isNaN(years)) max = max == null ? years : Math.max(max, years);
  }
  return max;
}

export function inferSkills(text: string) {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const skill of SKILL_HINTS) {
    if (lower.includes(skill.toLowerCase())) found.add(skill);
  }
  return [...found].slice(0, 12);
}

export function buildRequirements(description: string, highlights: string[] = []) {
  const trimmed = description.trim();
  if (highlights.length > 0) {
    return highlights.map((item) => item.trim()).filter(Boolean).join("\n");
  }
  const requirementSection = trimmed.match(/(?:requirements|what you.?ll need|qualifications)[:\s]*([\s\S]{0,1200})/i);
  return requirementSection?.[1]?.trim() || trimmed.slice(0, 1500);
}

export function isPostingStale(postedAt: Date | null, verifiedAt: Date, maxAgeDays = 60) {
  const anchor = postedAt ?? verifiedAt;
  const ageMs = verifiedAt.getTime() - anchor.getTime();
  return ageMs > maxAgeDays * 24 * 60 * 60 * 1000;
}
