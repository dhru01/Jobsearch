import { QUALIFICATION_LEVELS, type QualificationLevel } from "@/lib/matching/score";

function isQualificationLevel(level: string): level is QualificationLevel {
  return (QUALIFICATION_LEVELS as readonly string[]).includes(level);
}

type DegreeEntry = {
  name: string;
  levels: QualificationLevel[];
};

const DEGREE_CATALOG: DegreeEntry[] = [
  { name: "National Senior Certificate (NSC)", levels: ["matric"] },
  { name: "Matric", levels: ["matric"] },
  { name: "Higher Certificate in Accounting", levels: ["certificate"] },
  { name: "Higher Certificate in Business Management", levels: ["certificate"] },
  { name: "Higher Certificate in Information Technology", levels: ["certificate"] },
  { name: "Higher Certificate in Marketing", levels: ["certificate"] },
  { name: "Higher Certificate in Supply Chain Management", levels: ["certificate"] },
  { name: "Higher Certificate in Logistics", levels: ["certificate"] },
  { name: "Higher Certificate in Health Sciences", levels: ["certificate"] },
  { name: "Diploma in Accounting", levels: ["diploma"] },
  { name: "Diploma in Business Management", levels: ["diploma"] },
  { name: "Diploma in Educare", levels: ["diploma"] },
  { name: "Diploma in Human Resource Management", levels: ["diploma"] },
  { name: "Diploma in Information Technology", levels: ["diploma"] },
  { name: "Diploma in Marketing Management", levels: ["diploma"] },
  { name: "Diploma in Supply Chain Management", levels: ["diploma"] },
  { name: "Diploma in Logistics Management", levels: ["diploma"] },
  { name: "Diploma in Procurement and Supply Management", levels: ["diploma"] },
  { name: "Diploma in Diagnostic Radiography", levels: ["diploma"] },
  { name: "Diploma in Radiography", levels: ["diploma"] },
  { name: "Diploma in Nursing", levels: ["diploma"] },
  { name: "Diploma in Pharmacy Assistant", levels: ["diploma"] },
  { name: "Diploma in Hospitality Management", levels: ["diploma"] },
  { name: "Diploma in Tourism Management", levels: ["diploma"] },
  { name: "Diploma in Public Management", levels: ["diploma"] },
  { name: "Diploma in Law", levels: ["diploma"] },
  { name: "National Diploma in Engineering", levels: ["diploma"] },
  { name: "National Diploma in Supply Chain Management", levels: ["diploma"] },
  { name: "National Diploma in Radiography", levels: ["diploma"] },
  { name: "Advanced Diploma in Business Management", levels: ["diploma"] },
  { name: "Advanced Diploma in Supply Chain Management", levels: ["diploma"] },
  { name: "BA", levels: ["bachelors"] },
  { name: "BA Psychology", levels: ["bachelors"] },
  { name: "BA Law", levels: ["bachelors"] },
  { name: "BCom", levels: ["bachelors"] },
  { name: "BCom Accounting", levels: ["bachelors"] },
  { name: "BCom Economics", levels: ["bachelors"] },
  { name: "BCom Law", levels: ["bachelors"] },
  { name: "BCom Supply Chain Management", levels: ["bachelors"] },
  { name: "BCom Logistics Management", levels: ["bachelors"] },
  { name: "BCom Human Resource Management", levels: ["bachelors"] },
  { name: "BCom Marketing Management", levels: ["bachelors"] },
  { name: "BCom Finance", levels: ["bachelors"] },
  { name: "BCom Information Systems", levels: ["bachelors"] },
  { name: "BSc", levels: ["bachelors"] },
  { name: "BSc Computer Science", levels: ["bachelors"] },
  { name: "BSc Information Technology", levels: ["bachelors"] },
  { name: "BSc Engineering", levels: ["bachelors"] },
  { name: "BSc Radiography", levels: ["bachelors"] },
  { name: "Bachelor of Radiography", levels: ["bachelors"] },
  { name: "BSc Medical Imaging Sciences", levels: ["bachelors"] },
  { name: "BSc Nursing", levels: ["bachelors"] },
  { name: "BSc Physiotherapy", levels: ["bachelors"] },
  { name: "BSc Occupational Therapy", levels: ["bachelors"] },
  { name: "BSc Biomedical Sciences", levels: ["bachelors"] },
  { name: "BSc Biotechnology", levels: ["bachelors"] },
  { name: "BSc Environmental Science", levels: ["bachelors"] },
  { name: "BSc Agriculture", levels: ["bachelors"] },
  { name: "BEng", levels: ["bachelors"] },
  { name: "BEd", levels: ["bachelors"] },
  { name: "BEd Foundation Phase", levels: ["bachelors"] },
  { name: "LLB", levels: ["bachelors"] },
  { name: "BAdmin", levels: ["bachelors"] },
  { name: "BNurs", levels: ["bachelors"] },
  { name: "Bachelor of Nursing", levels: ["bachelors"] },
  { name: "BPharm", levels: ["bachelors"] },
  { name: "Bachelor of Pharmacy", levels: ["bachelors"] },
  { name: "Bachelor of Social Work", levels: ["bachelors"] },
  { name: "Bachelor of Commerce in Supply Chain Management", levels: ["bachelors"] },
  { name: "Bachelor of Health Sciences", levels: ["bachelors"] },
  { name: "Bachelor of Clinical Medical Practice", levels: ["bachelors"] },
  { name: "MBChB", levels: ["bachelors"] },
  { name: "BCom Honours", levels: ["honours"] },
  { name: "BSc Honours", levels: ["honours"] },
  { name: "Honours in Psychology", levels: ["honours"] },
  { name: "Honours in Supply Chain Management", levels: ["honours"] },
  { name: "Honours in Radiography", levels: ["honours"] },
  { name: "Postgraduate Diploma in Accounting", levels: ["honours"] },
  { name: "Postgraduate Diploma in Business Administration", levels: ["honours"] },
  { name: "Postgraduate Diploma in Supply Chain Management", levels: ["honours"] },
  { name: "Postgraduate Diploma in Public Health", levels: ["honours"] },
  { name: "MBA", levels: ["masters"] },
  { name: "MCom", levels: ["masters"] },
  { name: "MCom Supply Chain Management", levels: ["masters"] },
  { name: "MSc", levels: ["masters"] },
  { name: "MSc Radiography", levels: ["masters"] },
  { name: "MA", levels: ["masters"] },
  { name: "MEng", levels: ["masters"] },
  { name: "LLM", levels: ["masters"] },
  { name: "Master of Public Health", levels: ["masters"] },
  { name: "Master of Health Sciences", levels: ["masters"] },
  { name: "Master of Commerce in Logistics", levels: ["masters"] },
  { name: "PhD", levels: ["doctorate"] },
  { name: "Doctor of Philosophy", levels: ["doctorate"] },
  { name: "DBA", levels: ["doctorate"] },
];

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function queryVariants(query: string) {
  const base = normalise(query);
  const variants = new Set<string>([base]);
  if (base.includes("radiology")) {
    variants.add(base.replace(/radiology/g, "radiography"));
    variants.add(`${base} medical imaging`);
  }
  if (base.includes("radiography")) {
    variants.add(base.replace(/radiography/g, "radiology"));
  }
  if (base === "scm" || base.includes("supply chain")) {
    variants.add("supply chain");
  }
  return [...variants];
}

function scoreSingle(nameNorm: string, queryNorm: string) {
  if (!queryNorm) return 0;
  if (nameNorm === queryNorm) return 100;
  if (nameNorm.startsWith(queryNorm)) return 85;
  if (nameNorm.includes(queryNorm)) return 70;

  const tokens = queryNorm.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => nameNorm.includes(token))) {
    return 65;
  }

  if (tokens.length === 1) {
    const words = nameNorm.split(/[\s/(),&-]+/).filter(Boolean);
    if (words.some((word) => word.startsWith(tokens[0]))) return 50;
  }

  return 0;
}

function scoreDegree(name: string, query: string) {
  const nameNorm = normalise(name);
  return Math.max(0, ...queryVariants(query).map((variant) => scoreSingle(nameNorm, variant)));
}

export function searchDegrees(query: string, level: string, limit = 12) {
  if (!query.trim()) return [];
  const pool = isQualificationLevel(level)
    ? DEGREE_CATALOG.filter((entry) => entry.levels.includes(level))
    : DEGREE_CATALOG;

  const ranked = pool
    .map((entry) => ({ name: entry.name, score: scoreDegree(entry.name, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return ranked.slice(0, limit).map((item) => item.name);
}
