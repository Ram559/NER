export const VISIBLE_CATEGORIES = ["NER bukás", "EU pénzek", "korrupció", "állami tender", "propaganda"] as const;

const normalizedVisibleCategories = new Set(VISIBLE_CATEGORIES.map((category) => normalizeCategory(category)));

export function normalizeCategory(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function isVisibleCategory(value: string): boolean {
  return normalizedVisibleCategories.has(normalizeCategory(value));
}

export function visibleCategoryNames(): string[] {
  return [...VISIBLE_CATEGORIES];
}
