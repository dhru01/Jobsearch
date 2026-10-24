import { z } from "zod";

const experienceSchema = z.object({
  title: z.string(),
  organisation: z.string(),
  start: z.string(),
  end: z.string(),
  summary: z.string(),
});

const educationSchema = z.object({
  institution: z.string(),
  qualification: z.string(),
  field: z.string(),
  end_year: z.string(),
});

const qualificationSchema = z.object({
  name: z.string(),
  level: z.string(),
});

export const tailoredCvSchema = z.object({
  full_name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  headline: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  qualifications: z.array(qualificationSchema),
});

export const tailoredDocumentMetaSchema = z.object({
  version: z.literal(1),
  application_id: z.string().uuid(),
  job_id: z.string().uuid(),
  job_title: z.string(),
  company: z.string(),
  cv: tailoredCvSchema,
  cover_letter: z.string(),
});

export type TailoredCv = z.infer<typeof tailoredCvSchema>;
export type TailoredDocumentMeta = z.infer<typeof tailoredDocumentMetaSchema>;

export function parseTailoredDocumentMeta(value: unknown): TailoredDocumentMeta | null {
  const parsed = tailoredDocumentMetaSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
