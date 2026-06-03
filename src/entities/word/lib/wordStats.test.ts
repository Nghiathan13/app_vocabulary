import { describe, expect, it } from "vitest";
import { WordWithId } from "../model/types";
import {
  getDueCount,
  getDueReviewWords,
  getHighWrongCountWords,
  getLevelDistribution,
  getMasteredCount,
  MAX_LEVEL,
  WRONG_COUNT_THRESHOLD,
} from "./wordStats";

function createMockWord(overrides: Partial<WordWithId>): WordWithId {
  return {
    id: 1,
    word: "test",
    ipa: "",
    type: "",
    meaning_vi: "kiem tra",
    definition: "",
    example: "",
    band: "",
    level: 0,
    wrong_count: 0,
    last_review: null,
    next_review: null,
    ...overrides,
  };
}

describe("getLevelDistribution", () => {
  it("should return empty distribution counts when input list is empty", () => {
    const distribution = getLevelDistribution([]);
    expect(distribution).toHaveLength(MAX_LEVEL + 1);
    distribution.forEach((item, index) => {
      expect(item.level).toBe(index);
      expect(item.count).toBe(0);
    });
  });

  it("should calculate correct counts for each level", () => {
    const words = [
      createMockWord({ level: 0 }),
      createMockWord({ level: 0 }),
      createMockWord({ level: 1 }),
      createMockWord({ level: 3 }),
      createMockWord({ level: 5 }),
      createMockWord({ level: 6 }),
      createMockWord({ level: 7 }), // level 7 should be counted as level 6 (MAX_LEVEL)
    ];

    const distribution = getLevelDistribution(words);

    // Level 0: 2 words
    expect(distribution.find((d) => d.level === 0)?.count).toBe(2);
    // Level 1: 1 word
    expect(distribution.find((d) => d.level === 1)?.count).toBe(1);
    // Level 2: 0 words
    expect(distribution.find((d) => d.level === 2)?.count).toBe(0);
    // Level 3: 1 word
    expect(distribution.find((d) => d.level === 3)?.count).toBe(1);
    // Level 4: 0 words
    expect(distribution.find((d) => d.level === 4)?.count).toBe(0);
    // Level 5: 1 word
    expect(distribution.find((d) => d.level === 5)?.count).toBe(1);
    // Level 6 (MAX_LEVEL): 2 words (level 6 and level 7)
    expect(distribution.find((d) => d.level === MAX_LEVEL)?.count).toBe(2);
  });
});

describe("getHighWrongCountWords", () => {
  it("should filter out words below wrong count threshold", () => {
    const words = [
      createMockWord({ word: "apple", wrong_count: WRONG_COUNT_THRESHOLD - 1 }),
      createMockWord({ word: "banana", wrong_count: WRONG_COUNT_THRESHOLD }),
      createMockWord({ word: "cherry", wrong_count: WRONG_COUNT_THRESHOLD + 2 }),
    ];

    const result = getHighWrongCountWords(words);
    expect(result).toHaveLength(2);
    expect(result.map((w) => w.word)).not.toContain("apple");
  });

  it("should sort high wrong count words by wrong_count descending, then by word alphabetically", () => {
    const words = [
      createMockWord({ word: "cat", wrong_count: 5 }),
      createMockWord({ word: "dog", wrong_count: 6 }),
      createMockWord({ word: "ant", wrong_count: 5 }),
      createMockWord({ word: "bee", wrong_count: 8 }),
    ];

    const result = getHighWrongCountWords(words);
    // Sorted by wrong_count descending: bee (8), dog (6), then ant (5) and cat (5) sorted alphabetically
    expect(result.map((w) => w.word)).toEqual(["bee", "dog", "ant", "cat"]);
  });

  it("should slice the results to a maximum of 8 words", () => {
    const words = Array.from({ length: 15 }, (_, i) =>
      createMockWord({
        word: `word-${i}`,
        wrong_count: WRONG_COUNT_THRESHOLD + i,
      }),
    );

    const result = getHighWrongCountWords(words);
    expect(result).toHaveLength(8);
    // It should have the top 8 wrong counts (i.e. word-14 to word-7)
    expect(result[0].wrong_count).toBe(WRONG_COUNT_THRESHOLD + 14);
    expect(result[7].wrong_count).toBe(WRONG_COUNT_THRESHOLD + 7);
  });
});

describe("getDueCount", () => {
  it("should return 0 when there are no words", () => {
    expect(getDueCount([], "2026-06-03")).toBe(0);
  });

  it("should correctly count words with next_review date on or before today", () => {
    const words = [
      createMockWord({ next_review: "2026-06-02" }), // due (before)
      createMockWord({ next_review: "2026-06-03" }), // due (today)
      createMockWord({ next_review: "2026-06-04" }), // not due (after)
      createMockWord({ next_review: null }),         // not due (null)
    ];

    expect(getDueCount(words, "2026-06-03")).toBe(2);
  });
});

describe("getDueReviewWords", () => {
  it("should return due words sorted by next review date", () => {
    const words = [
      createMockWord({ word: "today", next_review: "2026-06-03" }),
      createMockWord({ word: "future", next_review: "2026-06-04" }),
      createMockWord({ word: "overdue", next_review: "2026-06-01" }),
      createMockWord({ word: "none", next_review: null }),
    ];

    const result = getDueReviewWords(words, "2026-06-03");

    expect(result.map((word) => word.word)).toEqual(["overdue", "today"]);
  });
});

describe("getMasteredCount", () => {
  it("should return 0 when there are no words", () => {
    expect(getMasteredCount([])).toBe(0);
  });

  it("should count words with level >= MAX_LEVEL", () => {
    const words = [
      createMockWord({ level: 5 }), // not mastered
      createMockWord({ level: 6 }), // mastered (equal to MAX_LEVEL)
      createMockWord({ level: 7 }), // mastered (greater than MAX_LEVEL)
    ];

    expect(getMasteredCount(words)).toBe(2);
  });
});
