import "server-only";
import { z } from "zod";
import { QUALIFICATION_LEVELS } from "@/lib/matching/score";

const nullableText = z.string().nullable();

const extractedSchema = z.object({
  full_name: nullableText,
  email: nullableText,
  phone: nullableText,
  location: nullableText,
  headline: nullableText,
  summary: nullableText,
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      institution: nullableText,
      qualification: nullableText,
      field: nullableText,
      end_year: nullableText,
    }),
  ),
  experience: z.array(
    z.object({
      title: nullableText,
      organisation: nullableText,
      start: nullableText,
      end: nullableText,
      summary: nullableText,
    }),
  ),
  qualifications: z.array(
    z.object({
      name: nullableText,
      level: z.enum(QUALIFICATION_LEVELS).nullable(),
    }),
  ),
  years_experience: z.number().nullable(),
  preferences: z.object({
    roles: z.array(z.string()),
    locations: z.array(z.string()),
    work_modes: z.array(z.enum(["remote", "hybrid", "on_site"])),
    open_to_relocate: z.boolean().nullable(),
  }),
});

export type ExtractedCv = z.infer<typeof extractedSchema>;

export class ExtractionNotConfiguredError extends Error {
  constructor() {
    super("CV extraction needs OPENAI_API_KEY. You can enter your profile manually.");
    this.name = "ExtractionNotConfiguredError";
  }
}

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    full_name: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    headline: { type: ["string", "null"] },
    summary: { type: ["string", "null"] },
    skills: { type: "array", items: { type: "string" } },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          institution: { type: ["string", "null"] },
          qualification: { type: ["string", "null"] },
          field: { type: ["string", "null"] },
          end_year: { type: ["string", "null"] },
        },
        required: ["institution", "qualification", "field", "end_year"],
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: ["string", "null"] },
          organisation: { type: ["string", "null"] },
          start: { type: ["string", "null"] },
          end: { type: ["string", "null"] },
          summary: { type: ["string", "null"] },
        },
        required: ["title", "organisation", "start", "end", "summary"],
      },
    },
    qualifications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: ["string", "null"] },
          level: {
            type: ["string", "null"],
            enum: [...QUALIFICATION_LEVELS, null],
          },
        },
        required: ["name", "level"],
      },
    },
    years_experience: { type: ["number", "null"] },
    preferences: {
      type: "object",
      additionalProperties: false,
      properties: {
        roles: { type: "array", items: { type: "string" } },
        locations: { type: "array", items: { type: "string" } },
        work_modes: {
          type: "array",
          items: { type: "string", enum: ["remote", "hybrid", "on_site"] },
        },
        open_to_relocate: { type: ["boolean", "null"] },
      },
      required: ["roles", "locations", "work_modes", "open_to_relocate"],
    },
  },
  required: [
    "full_name",
    "email",
    "phone",
    "location",
    "headline",
    "summary",
    "skills",
    "education",
    "experience",
    "qualifications",
    "years_experience",
    "preferences",
  ],
} as const;

function clean(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function extractionErrorFromStatus(status: number): string {
  if (status === 401) {
    return "OpenAI rejected the API key. Check OPENAI_API_KEY in .env.local (no spaces after =), then restart npm run dev.";
  }
  if (status === 429) {
    return "Your OpenAI account has no API credits left. Add billing at platform.openai.com, or enter your profile manually.";
  }
  if (status === 404 || status === 400) {
    return "OpenAI rejected the model name. Set OPENAI_MODEL=gpt-4o-mini in .env.local and restart npm run dev.";
  }
  return "The extraction service did not return a profile. You can enter your details manually.";
}

export async function extractCvFacts(cvText: string): Promise<ExtractedCv> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new ExtractionNotConfiguredError();
  }

  const clipped = cvText.slice(0, 24000);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You extract candidate facts from a CV for a South African careers product. Copy only facts that appear in the CV. If a fact is not stated, return null or an empty list. Do not infer employers, degrees, skills, locations, or dates. Do not guess years of experience. Set years_experience only when the CV states a number of years, or when role dates are explicit enough to add up. Map qualification level only when the CV names that level. Leave preferences empty unless the CV explicitly states preferred roles, locations, work mode, or willingness to relocate.",
        },
        {
          role: "user",
          content: clipped,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cv_extraction",
          strict: true,
          schema: jsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("CV extraction request failed", response.status, detail.slice(0, 500));
    throw new Error(extractionErrorFromStatus(response.status));
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("The extraction service did not return a profile. You can enter your details manually.");
  }

  const parsed = extractedSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("The extraction service returned an unreadable profile. You can enter your details manually.");
  }

  const facts = parsed.data;
  return {
    ...facts,
    full_name: clean(facts.full_name),
    email: clean(facts.email),
    phone: clean(facts.phone),
    location: clean(facts.location),
    headline: clean(facts.headline),
    summary: clean(facts.summary),
    skills: facts.skills.map((skill) => skill.trim()).filter(Boolean).slice(0, 50),
    education: facts.education
      .map((item) => ({
        institution: clean(item.institution),
        qualification: clean(item.qualification),
        field: clean(item.field),
        end_year: clean(item.end_year),
      }))
      .filter((item) => Object.values(item).some(Boolean))
      .slice(0, 20),
    experience: facts.experience
      .map((item) => ({
        title: clean(item.title),
        organisation: clean(item.organisation),
        start: clean(item.start),
        end: clean(item.end),
        summary: clean(item.summary),
      }))
      .filter((item) => Object.values(item).some(Boolean))
      .slice(0, 30),
    qualifications: facts.qualifications
      .map((item) => ({ name: clean(item.name), level: item.level }))
      .filter((item) => item.name || item.level)
      .slice(0, 20),
    years_experience:
      facts.years_experience != null && facts.years_experience >= 0 && facts.years_experience <= 60
        ? facts.years_experience
        : null,
    preferences: {
      roles: facts.preferences.roles.map((role) => role.trim()).filter(Boolean).slice(0, 20),
      locations: facts.preferences.locations.map((location) => location.trim()).filter(Boolean).slice(0, 20),
      work_modes: facts.preferences.work_modes,
      open_to_relocate: facts.preferences.open_to_relocate,
    },
  };
}
