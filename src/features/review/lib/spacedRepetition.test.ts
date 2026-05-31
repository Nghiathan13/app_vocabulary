import { describe, expect, it } from "vitest";

import {
  getDaysForLevel,
  getSpacedRepetitionUpdate,
} from "./spacedRepetition";

describe("getDaysForLevel", () => {
  it.each([
    [0, 2],
    [1, 4],
    [2, 7],
    [3, 15],
    [4, 30],
    [5, 60],
    [6, 0],
    [7, 60],
    [10, 60],
  ])("returns %i days for level %i", (level, days) => {
    expect(getDaysForLevel(level)).toBe(days);
  });
});

describe("getSpacedRepetitionUpdate", () => {
  describe("forgot (key 1)", () => {
    it.each([
      [4, 0, { nextLevel: 2, nextWrongCount: 1, daysToAdd: 4 }],
      [2, 1, { nextLevel: 0, nextWrongCount: 2, daysToAdd: 1 }],
      [3, 0, { nextLevel: 1, nextWrongCount: 1, daysToAdd: 2 }],
      [1, 0, { nextLevel: 0, nextWrongCount: 1, daysToAdd: 1 }],
      [0, 0, { nextLevel: 0, nextWrongCount: 1, daysToAdd: 1 }],
    ])(
      "at level %i with wrong_count %i",
      (currentLevel, currentWrongCount, expected) => {
        expect(
          getSpacedRepetitionUpdate(currentLevel, currentWrongCount, true),
        ).toEqual(expected);
      },
    );
  });

  describe("remember (key 4)", () => {
    it.each([
      [0, 0, { nextLevel: 1, nextWrongCount: 0, daysToAdd: 2 }],
      [1, 3, { nextLevel: 2, nextWrongCount: 0, daysToAdd: 4 }],
      [2, 0, { nextLevel: 3, nextWrongCount: 0, daysToAdd: 7 }],
      [3, 0, { nextLevel: 4, nextWrongCount: 0, daysToAdd: 15 }],
      [4, 0, { nextLevel: 5, nextWrongCount: 0, daysToAdd: 30 }],
      [5, 0, { nextLevel: 6, nextWrongCount: 0, daysToAdd: 60 }],
      [6, 0, { nextLevel: 7, nextWrongCount: 0, daysToAdd: 0 }],
      [7, 0, { nextLevel: 8, nextWrongCount: 0, daysToAdd: 60 }],
      [10, 0, { nextLevel: 11, nextWrongCount: 0, daysToAdd: 60 }],
    ])(
      "at level %i with wrong_count %i",
      (currentLevel, currentWrongCount, expected) => {
        expect(
          getSpacedRepetitionUpdate(currentLevel, currentWrongCount, false),
        ).toEqual(expected);
      },
    );
  });
});
