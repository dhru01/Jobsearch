import "server-only";
import { z } from "zod";
import type { CandidateProfile } from "@/lib/profile";
import {
  profileToTailoredCv,
  templateCoverLetter,
} from "@/lib/documents/profile-to-tailored";
import { tailoredCvSchema } from "@/lib/documents/tailored-types";

const responseSchema = z.object({
  cv: tailoredCvSchema,
  cover_letter: z.string(),
});

type JobForTailoring = {
  title: string;
  company: string;
  description: string;
  requirements: string;
  skills: string[];
};

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    cv: {
      type: "object",
      additionalProperties: false,
      properties: {
        full_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        headline: { type: "string" },
        summary: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
        experience: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              organisation: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              summary: { type: "string" },
            },
            required: ["title", "organisation", "start", "end", "summary"],
          },
        },
        education: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              institution: { type: "string" },
              qualification: { type: "string" },
              field: { type: "string" },
              end_year: { type: "string" },
            },
            required: ["institution", "qualification", "field", "end_year"],
          },
        },
        qualifications: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              level: { type: "string" },
            },
            required: ["name", "level"],
          },
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
        "experience",
        "education",
        "qualifications",
      ],
    },
    cover_letter: { type: "string" },
  },
  required: ["cv", "cover_letter"],
} as const;

function profilePayload(profile: CandidateProfile) {
  return {
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    headline: profile.headline,
    summary: profile.summary,
    skills: profile.skills,
    years_experience: profile.years_experience,
    education: profile.education,
    experience: profile.experience,
    qualifications: profile.qualifications,
  };
}

function enforceProfileBounds(cv: z.infer<typeof tailoredCvSchema>, profile: CandidateProfile) {
  const allowedSkills = new Set(profile.skills.map((skill) => skill.toLowerCase()));
  const skills = cv.skills.filter((skill) => allowedSkills.has(skill.toLowerCase()));
  const orderedSkills = skills.length > 0 ? skills : [...profile.skills];

  const experience = cv.experience.filter((_, index) => index < profile.experience.length).map((item, index) => {
    const source = profile.experience[index];
    return {
      title: source.title || item.title,
      organisation: source.organisation || item.organisation,
      start: source.start || item.start,
      end: source.end || item.end,
      summary: item.summary || source.summary,
    };
  });

  return {
    ...cv,
    full_name: profile.full_name?.trim() || cv.full_name,
    email: profile.email?.trim() || cv.email,
    phone: profile.phone?.trim() || cv.phone,
    location: profile.location?.trim() || cv.location,
    skills: orderedSkills,
    experience: experience.length ? experience : profileToTailoredCv(profile, { title: "", company: "", skills: [], description: "" }).experience,
    education: profile.education,
    qualifications: profile.qualifications.map((item) => ({ name: item.name, level: item.level })),
  };
}

export async function tailorDocumentsForJob(profile: CandidateProfile, job: JobForTailoring) {
  const fallbackCv = profileToTailoredCv(profile, job);
  const fallbackLetter = templateCoverLetter(profile, job);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { cv: fallbackCv, cover_letter: fallbackLetter, usedAi: false };
  }

  const jobText = [job.title, job.company, job.description, job.requirements].join("\n\n").slice(0, 12000);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You tailor application documents for a South African careers product. You receive a VERIFIED candidate profile JSON and a job posting. You may rephrase summaries and the cover letter to emphasise relevance, and reorder skills. You must NOT add employers, job titles, degrees, skills, locations, dates, metrics, or achievements that are not supported by the verified profile. Keep the same experience and education entries as the profile (same organisations, titles, and date strings). Do not invent references or certifications.",
        },
        {
          role: "user",
          content: JSON.stringify({ verified_profile: profilePayload(profile), job: jobText }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tailored_documents",
          strict: true,
          schema: jsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    console.error("Document tailoring request failed", response.status);
    return { cv: fallbackCv, cover_letter: fallbackLetter, usedAi: false };
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    return { cv: fallbackCv, cover_letter: fallbackLetter, usedAi: false };
  }

  const parsed = responseSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    return { cv: fallbackCv, cover_letter: fallbackLetter, usedAi: false };
  }

  const cv = enforceProfileBounds(parsed.data.cv, profile);
  return { cv, cover_letter: parsed.data.cover_letter.trim(), usedAi: true };
}
