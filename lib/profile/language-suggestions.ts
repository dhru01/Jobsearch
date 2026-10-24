/** Spoken / written languages for profile autocomplete (not programming languages). */
export const SPOKEN_LANGUAGE_OPTIONS = [
  "Afrikaans",
  "English",
  "isiNdebele",
  "isiXhosa",
  "isiZulu",
  "Sepedi",
  "Sesotho",
  "Setswana",
  "siSwati",
  "Tshivenda",
  "Xitsonga",
  "French",
  "German",
  "Portuguese",
  "Spanish",
  "Arabic",
  "Chinese (Mandarin)",
  "Hindi",
  "Urdu",
  "Swahili",
  "Shona",
  "Chichewa",
  "Somali",
  "Oromo",
  "Amharic",
  "Dutch",
  "Italian",
  "Greek",
  "Turkish",
  "Hebrew",
  "Japanese",
  "Korean",
  "Sign language",
] as const;

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function scoreLanguage(language: string, query: string) {
  const languageNorm = normalise(language);
  const queryNorm = normalise(query);
  if (!queryNorm) return 0;
  if (languageNorm === queryNorm) return 100;
  if (languageNorm.startsWith(queryNorm)) return 80;
  if (languageNorm.includes(queryNorm)) return 50;
  return 0;
}

export function selectedLanguagesFromList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function searchSpokenLanguages(query: string, limit = 10, alreadySelected: string[] = []) {
  if (!query.trim()) return [];
  const selected = new Set(alreadySelected.map((item) => normalise(item)));
  return SPOKEN_LANGUAGE_OPTIONS.filter((language) => !selected.has(normalise(language)))
    .map((language) => ({ language, score: scoreLanguage(language, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.language.localeCompare(b.language))
    .slice(0, limit)
    .map((item) => item.language);
}

export {
  appendSkillToList as appendLanguageToList,
  replacePendingSkillToken as replacePendingLanguageToken,
} from "@/lib/profile/skill-suggestions";
