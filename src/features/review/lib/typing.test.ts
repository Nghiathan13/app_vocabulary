import { describe, expect, it } from "vitest";

import {
  compareTypingAnswer,
  getTypingAnswer,
  normalizeTypingAnswer,
} from "./typing";

describe("normalizeTypingAnswer", () => {
  it("trims, lowercases, and collapses whitespace", () => {
    expect(normalizeTypingAnswer("  Hello   World  ")).toBe("hello world");
    expect(normalizeTypingAnswer("UPPER")).toBe("upper");
  });
});

describe("getTypingAnswer", () => {
  it("strips parenthetical text and collapses whitespace", () => {
    expect(getTypingAnswer("run (verb)")).toBe("run");
    expect(getTypingAnswer("  spaced   out  ")).toBe("spaced out");
    expect(getTypingAnswer("keep (a) (b)")).toBe("keep");
  });
});

describe("compareTypingAnswer", () => {
  it("ignores casing and repeated spaces", () => {
    expect(compareTypingAnswer("Hello", "hello")).toBe(true);
    expect(compareTypingAnswer("run (verb)", "  RUN  ")).toBe(true);
  });

  it("returns false for wrong answer", () => {
    expect(compareTypingAnswer("hello", "world")).toBe(false);
  });
});
