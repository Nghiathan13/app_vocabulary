import { WordWithId } from "../../../entities/word/model/types";

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

export type SearchMatchColumn = "word" | "meaning" | null;

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
    return (word.meaning ?? "").toLowerCase().includes(query.toLowerCase())
      ? "meaning"
      : null;
  }

  const normalizedQuery = normalizeSearchText(query);

  if (normalizeSearchText(word.word).includes(normalizedQuery)) {
    return "word";
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
    case "meaning":
      return 1;
  }
};
