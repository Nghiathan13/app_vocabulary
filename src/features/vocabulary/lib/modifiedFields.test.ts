import { describe, expect, it } from "vitest";

import {
  getModifiedWordIds,
  makeModifiedFieldKey,
  normalizeComparableFieldValue,
  normalizeComparableValue,
  parseModifiedFieldKey,
} from "./modifiedFields";

describe("makeModifiedFieldKey", () => {
  it("builds id::field key", () => {
    expect(makeModifiedFieldKey(12, "word")).toBe("12::word");
  });
});

describe("parseModifiedFieldKey", () => {
  it("parses valid key", () => {
    expect(parseModifiedFieldKey("12::meaning_vi")).toEqual({
      id: "12",
      field: "meaning_vi",
    });
  });

  it("returns null for malformed key", () => {
    expect(parseModifiedFieldKey("invalid")).toBeNull();
    expect(parseModifiedFieldKey("12::not_a_field")).toBeNull();
    expect(parseModifiedFieldKey("::word")).toBeNull();
  });
});

describe("normalizeComparableValue", () => {
  it("returns empty string for null and undefined", () => {
    expect(normalizeComparableValue(null)).toBe("");
    expect(normalizeComparableValue(undefined)).toBe("");
  });

  it("stringifies other values", () => {
    expect(normalizeComparableValue(3)).toBe("3");
  });
});

describe("normalizeComparableFieldValue", () => {
  it("preserves word, level, and meaning_vi values", () => {
    expect(normalizeComparableFieldValue("word", "")).toBe("");
    expect(normalizeComparableFieldValue("level", 0)).toBe(0);
  });

  it("coerces empty optional fields to null", () => {
    expect(normalizeComparableFieldValue("ipa", "")).toBeNull();
    expect(normalizeComparableFieldValue("type", null)).toBeNull();
  });
});

describe("getModifiedWordIds", () => {
  it("collects unique word ids from modified keys", () => {
    const ids = getModifiedWordIds(
      new Set(["1::word", "1::ipa", "2::type"]),
    );

    expect(ids).toEqual(new Set(["1", "2"]));
  });

  it("uses text before separator even when field is invalid", () => {
    const ids = getModifiedWordIds(new Set(["3::bad", "4::word"]));

    expect(ids).toEqual(new Set(["3", "4"]));
  });
});
