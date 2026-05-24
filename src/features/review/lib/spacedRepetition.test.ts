import { describe, expect, it } from "vitest";

import { getSpacedRepetitionUpdate } from "./spacedRepetition";

describe("getSpacedRepetitionUpdate", () => {
  it("returns nextReps 0 and daysToAdd 1 when forgot", () => {
    expect(getSpacedRepetitionUpdate(5, true)).toEqual({
      nextReps: 0,
      daysToAdd: 1,
    });
  });

  it.each([
    [0, { nextReps: 1, daysToAdd: 2 }],
    [1, { nextReps: 2, daysToAdd: 4 }],
    [2, { nextReps: 3, daysToAdd: 7 }],
    [3, { nextReps: 4, daysToAdd: 15 }],
    [4, { nextReps: 5, daysToAdd: 30 }],
    [5, { nextReps: 6, daysToAdd: 60 }],
    [6, { nextReps: 7, daysToAdd: 0 }],
    [7, { nextReps: 8, daysToAdd: 60 }],
    [10, { nextReps: 11, daysToAdd: 60 }],
  ])(
    "returns expected update when remembered at currentReps %i",
    (currentReps, expected) => {
      expect(getSpacedRepetitionUpdate(currentReps, false)).toEqual(expected);
    },
  );
});
