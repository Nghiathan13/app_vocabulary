import { describe, expect, it } from "vitest";

import type { WordWithId } from "../../../entities/word/model/types";

import {
  getSearchMatchColumn,
  getSearchPriority,
  normalizeSearchText,
} from "./tableSearch";

const makeWord = (overrides: Partial<WordWithId> = {}): WordWithId => ({
  id: 1,
  word: "hello",
  ipa: null,
  type: "noun",
  meaning: "a greeting",
  reps: 3,
  last_review: null,
  next_review: null,
  ...overrides,
});

describe("normalizeSearchText", () => {
  it("removes diacritics, lowercases, and trims", () => {
    expect(normalizeSearchText("  Café  ")).toBe("cafe");
  });

  it("handles null and undefined as empty string", () => {
    expect(normalizeSearchText(null)).toBe("");
    expect(normalizeSearchText(undefined)).toBe("");
  });
});

describe("getSearchMatchColumn", () => {
  it("does not search reps or type", () => {
    expect(getSearchMatchColumn(makeWord({ reps: 12 }), "12")).toBeNull();
    expect(
      getSearchMatchColumn(
        makeWord({ word: "xyz", type: "verb", meaning: "to move" }),
        "verb",
      ),
    ).toBeNull();
  });

  it("searches word, then meaning for non-diacritic queries", () => {
    expect(getSearchMatchColumn(makeWord({ word: "Hello" }), "hel")).toBe(
      "word",
    );
    expect(
      getSearchMatchColumn(
        makeWord({ word: "xyz", meaning: "to greet" }),
        "greet",
      ),
    ).toBe("meaning");
  });

  it("prefers word match over meaning match", () => {
    expect(
      getSearchMatchColumn(
        makeWord({ word: "greet", meaning: "greet" }),
        "greet",
      ),
    ).toBe("word");
  });

  it("returns null for empty query", () => {
    expect(getSearchMatchColumn(makeWord(), "")).toBeNull();
    expect(getSearchMatchColumn(makeWord(), "   ")).toBeNull();
  });

  it("uses meaning-only matching for diacritic queries", () => {
    expect(
      getSearchMatchColumn(makeWord({ meaning: "trà" }), "trà"),
    ).toBe("meaning");
    expect(
      getSearchMatchColumn(makeWord({ word: "tea", meaning: "tra" }), "trà"),
    ).toBeNull();
    expect(
      getSearchMatchColumn(makeWord({ meaning: "café" }), "café"),
    ).toBe("meaning");
  });
});

describe("getSearchPriority", () => {
  it("returns word=0, meaning=1", () => {
    expect(getSearchPriority("word")).toBe(0);
    expect(getSearchPriority("meaning")).toBe(1);
  });
});
