export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyList(value: string[] | null | undefined): string {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

export function display(value: string | null | undefined, fallback = "未填写") {
  return value && value.trim() ? value : fallback;
}

export function listToText(value: string | null | undefined): string {
  return parseList(value).join("、");
}

export function textToList(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];

  return value
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
