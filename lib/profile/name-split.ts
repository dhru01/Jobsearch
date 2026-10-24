export function composedFullName(input: {
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name?: string;
}) {
  const parts = [input.first_name, input.middle_name ?? "", input.last_name]
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return input.full_name?.trim() ?? "";
}

export function suggestNameSplit(fullName: string): { first_name: string; last_name: string } | null {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 2) return null;
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export function shouldSuggestNameSplit(input: {
  full_name: string;
  first_name: string;
  last_name: string;
}) {
  return Boolean(input.full_name.trim()) && !input.first_name.trim() && !input.last_name.trim();
}
