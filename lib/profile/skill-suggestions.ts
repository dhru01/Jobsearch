/** Curated skills for autocomplete (matching + applications). Users can still type custom skills. */
export const SKILL_CATALOG = [
  "Communication",
  "Customer service",
  "Teamwork",
  "Time management",
  "Problem solving",
  "Attention to detail",
  "Administration",
  "Cash handling",
  "Retail sales",
  "Stock control",
  "Merchandising",
  "Reception",
  "Data entry",
  "Filing",
  "Bookkeeping",
  "Excel",
  "Microsoft Office",
  "Driving licence",
  "First aid",
  "Health and safety",
  "Training",
  "Coaching",
  "Supervision",
  "Call centre",
  "Hospitality",
  "Housekeeping",
  "Catering",
  "Food preparation",
  "Barista",
  "Waitering",
  "Security",
  "Warehouse management",
  "Logistics",
  "Procurement",
  "Teaching",
  "Tutoring",
  "Lesson planning",
  "Childcare",
  "Patient care",
  "Nursing care",
  "Counselling",
  "Social work",
  "Marketing",
  "Sales",
  "Negotiation",
  "Report writing",
  "Research",
  "Project management",
  "Event planning",
  "Public speaking",
  "Accounting",
  "Adaptability",
  "Adobe Creative Suite",
  "Agile",
  "Amazon Web Services",
  "Analysis",
  "Analytical thinking",
  "Android",
  "Angular",
  "Attention to detail",
  "Audit",
  "AutoCAD",
  "Azure",
  "Bookkeeping",
  "Budgeting",
  "Business analysis",
  "C#",
  "C++",
  "Canva",
  "Cash handling",
  "Change management",
  "CI/CD",
  "Client service",
  "Coaching",
  "Communication",
  "Compliance",
  "Conflict resolution",
  "Content writing",
  "Contract management",
  "Copywriting",
  "Critical thinking",
  "Customer service",
  "Data analysis",
  "Data entry",
  "Data visualization",
  "Databases",
  "Decision making",
  "DevOps",
  "Digital marketing",
  "Docker",
  "Driving licence",
  "Economics",
  "Editing",
  "Electrical engineering",
  "Email marketing",
  "Emotional intelligence",
  "Engineering",
  "English",
  "Entrepreneurship",
  "Event planning",
  "Excel",
  "Facilitation",
  "Fast learner",
  "Finance",
  "Financial analysis",
  "Financial modelling",
  "First aid",
  "Flutter",
  "French",
  "Front-end development",
  "Full-stack development",
  "Git",
  "Go",
  "Google Analytics",
  "Google Workspace",
  "Graphic design",
  "HTML",
  "Human resources",
  "Inventory management",
  "Investigation",
  "iOS",
  "ISO standards",
  "Java",
  "JavaScript",
  "Journalism",
  "jQuery",
  "Kotlin",
  "Kubernetes",
  "Labour relations",
  "Leadership",
  "Legal research",
  "Linux",
  "Logistics",
  "Machine learning",
  "Management",
  "Marketing",
  "MATLAB",
  "Mechanical engineering",
  "Mentoring",
  "Microsoft 365",
  "Microsoft Office",
  "Microsoft Power BI",
  "Microsoft PowerPoint",
  "Microsoft Teams",
  "Microsoft Word",
  "Negotiation",
  "Networking",
  "Node.js",
  "Numeracy",
  "Operations management",
  "Organisation",
  "Payroll",
  "People management",
  "People skills",
  "Photoshop",
  "PHP",
  "Planning",
  "Positive attitude",
  "Power BI",
  "Presentation skills",
  "Problem solving",
  "Procurement",
  "Product management",
  "Project management",
  "Public speaking",
  "Python",
  "Quality assurance",
  "QuickBooks",
  "R",
  "React",
  "React Native",
  "Record keeping",
  "Relationship building",
  "Report writing",
  "Research",
  "Responsible",
  "Respect",
  "Retail sales",
  "Risk management",
  "Ruby",
  "Rust",
  "Sales",
  "Salesforce",
  "SAP",
  "Scrum",
  "Search engine optimisation",
  "Security",
  "SharePoint",
  "Social media",
  "SQL",
  "Stakeholder management",
  "Statistics",
  "Strategic planning",
  "Supply chain",
  "Swift",
  "Teamwork",
  "Technical support",
  "Technical writing",
  "Telephone etiquette",
  "Time management",
  "Training",
  "Troubleshooting",
  "TypeScript",
  "UI design",
  "UX design",
  "Vendor management",
  "Video editing",
  "Vue.js",
  "Warehouse management",
  "Web design",
  "Web development",
  "Windows Server",
  "WordPress",
  "Work ethic",
  "Writing",
  "Xero",
  "Zulu",
  "Afrikaans",
  "isiXhosa",
  "Punctual",
] as const;

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function scoreSkill(skill: string, query: string) {
  const skillNorm = normalise(skill);
  const queryNorm = normalise(query);
  if (!queryNorm) return 1;
  if (skillNorm === queryNorm) return 100;
  if (skillNorm.startsWith(queryNorm)) return 80;
  if (skillNorm.includes(queryNorm)) return 50;
  const words = skillNorm.split(/[\s/()-]+/);
  if (words.some((word) => word.startsWith(queryNorm))) return 60;
  return 0;
}

export function selectedSkillsFromList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function searchSkills(query: string, limit = 10, alreadySelected: string[] = []) {
  const selected = new Set(alreadySelected.map((item) => normalise(item)));
  const pool = SKILL_CATALOG.filter((skill) => !selected.has(normalise(skill)));
  const ranked = pool
    .map((skill) => ({ skill, score: scoreSkill(skill, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill));

  if (ranked.length > 0) {
    return ranked.slice(0, limit).map((item) => item.skill);
  }

  return [];
}

export function appendSkillToList(value: string, skill: string) {
  const trimmedSkill = skill.trim();
  if (!trimmedSkill) return value;
  const existing = selectedSkillsFromList(value);
  if (existing.some((item) => normalise(item) === normalise(trimmedSkill))) {
    const lastComma = value.lastIndexOf(",");
    if (lastComma === -1) return `${existing.join(", ")}, `;
    return `${value.slice(0, lastComma + 1)} `;
  }

  const lastComma = value.lastIndexOf(",");
  if (lastComma === -1) {
    return `${trimmedSkill}, `;
  }
  const prefix = value.slice(0, lastComma + 1);
  return `${prefix} ${trimmedSkill}, `;
}

export function replacePendingSkillToken(value: string, skill: string) {
  const lastComma = value.lastIndexOf(",");
  const prefix = lastComma === -1 ? "" : `${value.slice(0, lastComma + 1)} `;
  return `${prefix}${skill.trim()}, `;
}
