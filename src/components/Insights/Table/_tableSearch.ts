import { WordWithId } from "../../../types";

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;
const NUMBER_SEARCH_REGEX = /^\d+$/;

export type SearchMatchColumn = "word" | "type" | "meaning" | "reps" | null;

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

  if (NUMBER_SEARCH_REGEX.test(query)) {
    return String(word.reps).includes(query) ? "reps" : null;
  }

  if (hasDiacritics(query)) {
    return (word.meaning ?? "").toLowerCase().includes(query.toLowerCase())
      ? "meaning"
      : null;
  }

  const normalizedQuery = normalizeSearchText(query);

  if (normalizeSearchText(word.word).includes(normalizedQuery)) {
    return "word";
  }

  if (normalizeSearchText(word.type).includes(normalizedQuery)) {
    return "type";
  }

  if (normalizeSearchText(word.meaning).includes(normalizedQuery)) {
    return "meaning";
  }

  return null;
};

export const getSearchPriority = (column: Exclude<SearchMatchColumn, null>) => {
  switch (column) {
    case "word":
      return 0;
    case "type":
      return 1;
    case "meaning":
      return 2;
    case "reps":
      return 3;
  }
};
