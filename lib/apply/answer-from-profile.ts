import type { CandidateProfile } from "@/lib/profile";

export type ApplicationQuestionGap = {
  question: string;
  status: "answered" | "missing";
  answer?: string;
  source?: "profile" | "reusable";
};

/** Find a truthful draft for a job question from confirmed profile data only. Never invents facts. */
export function answerFromVerifiedProfile(
  profile: CandidateProfile,
  question: string,
): ApplicationQuestionGap {
  const needle = question.toLowerCase();
  const standard = profile.extended.standard_answers;
  const reusable = profile.extended.custom_answers.find(
    (item) => item.confirmed && item.question.trim() && item.question.toLowerCase() === needle,
  );

  if (reusable) {
    return { question, status: "answered", answer: reusable.answer, source: "reusable" };
  }

  const mapped: Array<[RegExp, string | undefined]> = [
    [/authoris|eligib|work permit|visa/, profile.work_authorisation || standard.authorised_to_work],
    [/notice/, profile.notice_period || standard.notice_period],
    [/start|availab/, profile.availability_date || standard.start_date],
    [/salary|remuneration/, profile.preferences.min_salary != null ? String(profile.preferences.min_salary) : standard.expected_salary],
    [/relocat/, profile.preferences.open_to_relocate ? "Yes, within South Africa" : standard.willing_relocate],
    [/years of experience|experience do you/, profile.years_experience != null ? String(profile.years_experience) : standard.years_experience],
  ];

  for (const [pattern, value] of mapped) {
    if (pattern.test(needle) && value?.trim()) {
      return { question, status: "answered", answer: value.trim(), source: "profile" };
    }
  }

  return { question, status: "missing" };
}
