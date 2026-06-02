import type { WordId, WordWithId } from "../../../entities/word/model/types";
import type { TableEditableField } from "../model/tableTypes";
import { normalizeComparableValue, parseModifiedFieldKey } from "./modifiedFields";

export interface WordChange {
  id: WordId;
  word: string;
  field: TableEditableField;
  oldValue: string;
  newValue: string;
}

export function buildWordChanges({
  modifiedFields,
  existingWords,
  editedWords,
}: {
  modifiedFields: Set<string>;
  existingWords: WordWithId[];
  editedWords: WordWithId[];
}): WordChange[] {
  const list: WordChange[] = [];

  modifiedFields.forEach((fieldKey) => {
    const parsed = parseModifiedFieldKey(fieldKey);

    if (!parsed) {
      return;
    }

    const { id, field } = parsed;
    const originalWord = existingWords.find((word) => String(word.id) === id);
    const editedWord = editedWords.find((word) => String(word.id) === id);

    if (!originalWord || !editedWord) {
      return;
    }

    list.push({
      id: originalWord.id,
      word: originalWord.word,
      field,
      oldValue: normalizeComparableValue(originalWord[field]),
      newValue: normalizeComparableValue(editedWord[field]),
    });
  });

  return list.sort((a, b) => a.word.localeCompare(b.word));
}
