import { WordWithId } from "../../../entities/word/model/types";

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

export type SearchMatchColumn = "word" | "meaning_vi" | null;

export const normalizeSearchText = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim();

export const hasDiacritics = (value: string) =>
  value.normalize("NFD") !== value;

export const getSearchMatchColumn = (
  word: WordWithId,
  rawQuery: string,
): SearchMatchColumn => {
  const query = rawQuery.trim();

  if (!query) {
    return null;
  }

  if (hasDiacritics(query)) {
    return word.meaning_vi.toLowerCase().includes(query.toLowerCase())
      ? "meaning_vi"
      : null;
  }

  const normalizedQuery = normalizeSearchText(query);

  if (normalizeSearchText(word.word).includes(normalizedQuery)) {
    return "word";
  }

  if (normalizeSearchText(word.meaning_vi).includes(normalizedQuery)) {
    return "meaning_vi";
  }

  return null;
};

export const getSearchPriority = (column: Exclude<SearchMatchColumn, null>) => {
  switch (column) {
    case "word":
      return 0;
    case "meaning_vi":
      return 1;
  }
};
