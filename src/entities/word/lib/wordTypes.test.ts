import { describe, expect, it } from "vitest";

import {
  formatWordTypeLabel,
  getWordTypeKind,
  splitWordTypeLabels,
} from "./wordTypes";

describe("splitWordTypeLabels", () => {
  it("splits word types by slash, comma, and semicolon", () => {
    expect(splitWordTypeLabels("noun/verb, adjective; adv")).toEqual([
      "noun",
      "verb",
      "adjective",
      "adv",
    ]);
  });

  it("removes empty type labels", () => {
    expect(splitWordTypeLabels("noun / / verb")).toEqual(["noun", "verb"]);
  });
});

describe("getWordTypeKind", () => {
  it("maps known type aliases to stable kinds", () => {
    expect(getWordTypeKind("adv")).toBe("adverb");
    expect(getWordTypeKind("adj")).toBe("adjective");
    expect(getWordTypeKind("prep")).toBe("preposition");
  });

  it("detects phrasal types", () => {
    expect(getWordTypeKind("phrasal verb")).toBe("phrasal");
  });

  it("returns default for unknown types", () => {
    expect(getWordTypeKind("idiom")).toBe("default");
  });
});

describe("formatWordTypeLabel", () => {
  it("capitalizes each word in the type label", () => {
    expect(formatWordTypeLabel("phrasal verb")).toBe("Phrasal Verb");
  });
});
