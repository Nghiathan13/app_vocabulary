export type WordTypeKind =
  | "phrasal"
  | "adverb"
  | "preposition"
  | "noun"
  | "adjective"
  | "verb"
  | "default";

export function splitWordTypeLabels(type: string | null): string[] {
  return (type || "")
    .split(/[,/;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getWordTypeKind(type: string | null): WordTypeKind {
  const normalizedType = type?.trim().toLowerCase() || "";

  if (normalizedType.includes("phrasal")) {
    return "phrasal";
  }

  if (normalizedType === "adverb" || normalizedType === "adv") {
    return "adverb";
  }

  if (normalizedType === "preposition" || normalizedType === "prep") {
    return "preposition";
  }

  if (normalizedType === "noun") {
    return "noun";
  }

  if (normalizedType === "adjective" || normalizedType === "adj") {
    return "adjective";
  }

  if (normalizedType === "verb") {
    return "verb";
  }

  return "default";
}

export function formatWordTypeLabel(type: string | null): string {
  if (!type) {
    return "";
  }

  return type
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
