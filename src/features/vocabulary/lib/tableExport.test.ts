import { describe, expect, it } from "vitest";

import type { WordWithId } from "../../../entities/word/model/types";
import { toExportRows } from "./tableExport";

const baseWord: WordWithId = {
  id: 1,
  word: "apple",
  ipa: "/ˈæp.əl/",
  type: "noun",
  meaning_vi: "quả táo",
  definition: "a fruit",
  example: "an apple a day",
  band: "B2",
  level: 2,
  wrong_count: 1,
  last_review: "2026-01-01",
  next_review: "2026-01-08",
};

describe("toExportRows", () => {
  it("maps words to export columns in order", () => {
    const [row] = toExportRows([baseWord]);

    expect(Object.keys(row)).toEqual([
      "Word",
      "IPA",
      "Type",
      "Meaning VI",
      "Level",
      "Wrong Count",
      "Definition",
      "Example",
      "Band",
      "Last Review",
      "Next Review",
    ]);
  });

  it("preserves values and empty-string fallbacks for nullable fields", () => {
    const [row] = toExportRows([
      {
        ...baseWord,
        ipa: null,
        type: null,
        definition: null,
        example: null,
        band: null,
        last_review: null,
        next_review: null,
      },
    ]);

    expect(row).toEqual({
      Word: "apple",
      IPA: "",
      Type: "",
      "Meaning VI": "quả táo",
      Level: 2,
      "Wrong Count": 1,
      Definition: "",
      Example: "",
      Band: "",
      "Last Review": "",
      "Next Review": "",
    });
  });
});
