import { describe, expect, it } from "vitest";

import type { WordWithId } from "../../../entities/word/model/types";
import { makeModifiedFieldKey } from "./modifiedFields";
import { buildWordChanges } from "./tableEditChanges";

const baseWord: WordWithId = {
  id: 1,
  word: "apple",
  ipa: "/a/",
  type: "noun",
  meaning_vi: "táo",
  definition: null,
  example: null,
  band: null,
  level: 1,
  wrong_count: 0,
  last_review: null,
  next_review: null,
};

describe("buildWordChanges", () => {
  it("builds one field change", () => {
    const existingWords = [baseWord];
    const editedWords = [{ ...baseWord, meaning_vi: "quả táo" }];

    const changes = buildWordChanges({
      modifiedFields: new Set([makeModifiedFieldKey(1, "meaning_vi")]),
      existingWords,
      editedWords,
    });

    expect(changes).toEqual([
      {
        id: 1,
        word: "apple",
        field: "meaning_vi",
        oldValue: "táo",
        newValue: "quả táo",
      },
    ]);
  });

  it("builds multiple fields for the same word", () => {
    const existingWords = [baseWord];
    const editedWords = [
      { ...baseWord, ipa: "/æ/", type: "verb" },
    ];

    const changes = buildWordChanges({
      modifiedFields: new Set([
        makeModifiedFieldKey(1, "ipa"),
        makeModifiedFieldKey(1, "type"),
      ]),
      existingWords,
      editedWords,
    });

    expect(changes).toHaveLength(2);
    expect(changes.map((change) => change.field).sort()).toEqual(["ipa", "type"]);
  });

  it("ignores malformed keys", () => {
    const changes = buildWordChanges({
      modifiedFields: new Set(["bad-key", makeModifiedFieldKey(1, "word")]),
      existingWords: [baseWord],
      editedWords: [{ ...baseWord, word: "banana" }],
    });

    expect(changes).toHaveLength(1);
    expect(changes[0]?.field).toBe("word");
  });

  it("ignores missing existing or edited words", () => {
    const changes = buildWordChanges({
      modifiedFields: new Set([makeModifiedFieldKey(99, "word")]),
      existingWords: [baseWord],
      editedWords: [baseWord],
    });

    expect(changes).toEqual([]);
  });

  it("sorts changes by word label", () => {
    const zebra: WordWithId = { ...baseWord, id: 2, word: "zebra" };
    const apple: WordWithId = { ...baseWord, id: 1, word: "apple" };

    const changes = buildWordChanges({
      modifiedFields: new Set([
        makeModifiedFieldKey(2, "word"),
        makeModifiedFieldKey(1, "word"),
      ]),
      existingWords: [zebra, apple],
      editedWords: [
        { ...zebra, word: "zebrax" },
        { ...apple, word: "applex" },
      ],
    });

    expect(changes.map((change) => change.word)).toEqual(["apple", "zebra"]);
  });
});
