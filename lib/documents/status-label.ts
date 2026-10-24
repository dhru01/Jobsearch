/** User-facing label for `documents.status` (not file availability). */
export function documentStatusNote(status: string | null | undefined): string | null {
  switch (status) {
    case "failed":
      return "Automatic profile read failed — your file is still saved and you can preview it here.";
    case "extracted":
      return "Profile read from this file during onboarding.";
    case "confirmed":
      return "Confirmed.";
    default:
      return null;
  }
}
