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
  meaning_vi: "a greeting",
  definition: null,
  example: null,
  band: null,
  level: 3,
  wrong_count: 0,
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
  it("does not search level or type", () => {
    expect(getSearchMatchColumn(makeWord({ level: 12 }), "12")).toBeNull();
    expect(
      getSearchMatchColumn(
        makeWord({ word: "xyz", type: "verb", meaning_vi: "to move" }),
        "verb",
      ),
    ).toBeNull();
  });

  it("searches word, then meaning_vi for non-diacritic queries", () => {
    expect(getSearchMatchColumn(makeWord({ word: "Hello" }), "hel")).toBe(
      "word",
    );
    expect(
      getSearchMatchColumn(
        makeWord({ word: "xyz", meaning_vi: "to greet" }),
        "greet",
      ),
    ).toBe("meaning_vi");
  });

  it("prefers word match over meaning_vi match", () => {
    expect(
      getSearchMatchColumn(
        makeWord({ word: "greet", meaning_vi: "greet" }),
        "greet",
      ),
    ).toBe("word");
  });

  it("returns null for empty query", () => {
    expect(getSearchMatchColumn(makeWord(), "")).toBeNull();
    expect(getSearchMatchColumn(makeWord(), "   ")).toBeNull();
  });

  it("uses meaning_vi-only matching for diacritic queries", () => {
    expect(
      getSearchMatchColumn(makeWord({ meaning_vi: "trà" }), "trà"),
    ).toBe("meaning_vi");
    expect(
      getSearchMatchColumn(makeWord({ word: "tea", meaning_vi: "tra" }), "trà"),
    ).toBeNull();
    expect(
      getSearchMatchColumn(makeWord({ meaning_vi: "café" }), "café"),
    ).toBe("meaning_vi");
  });
});

describe("getSearchPriority", () => {
  it("returns word=0, meaning_vi=1", () => {
    expect(getSearchPriority("word")).toBe(0);
    expect(getSearchPriority("meaning_vi")).toBe(1);
  });
});
