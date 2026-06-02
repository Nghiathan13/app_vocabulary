import type { WordId, WordWithId } from "../../../entities/word/model/types";
import type { TableEditableField } from "../model/tableTypes";

export const MODIFIED_FIELD_SEPARATOR = "::";

const TABLE_EDITABLE_FIELDS = new Set<TableEditableField>([
  "word",
  "ipa",
  "type",
  "meaning_vi",
  "level",
  "last_review",
  "next_review",
]);

export function makeModifiedFieldKey(
  id: WordId,
  field: TableEditableField,
): string {
  return `${id}${MODIFIED_FIELD_SEPARATOR}${field}`;
}

export function parseModifiedFieldKey(
  key: string,
): { id: string; field: TableEditableField } | null {
  const separatorIndex = key.indexOf(MODIFIED_FIELD_SEPARATOR);

  if (separatorIndex <= 0) {
    return null;
  }

  const id = key.slice(0, separatorIndex);
  const field = key.slice(separatorIndex + MODIFIED_FIELD_SEPARATOR.length);

  if (!id || !TABLE_EDITABLE_FIELDS.has(field as TableEditableField)) {
    return null;
  }

  return { id, field: field as TableEditableField };
}

export function normalizeComparableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export function normalizeComparableFieldValue(
  field: TableEditableField,
  value: WordWithId[TableEditableField],
) {
  if (field === "word" || field === "level" || field === "meaning_vi") {
    return value;
  }

  return value || null;
}

export function getModifiedWordIds(modifiedFields: Set<string>): Set<string> {
  const ids = new Set<string>();

  for (const key of modifiedFields) {
    ids.add(key.split(MODIFIED_FIELD_SEPARATOR)[0]);
  }

  return ids;
}

export function isModifiedField(
  modifiedFields: Set<string>,
  id: WordId,
  field: TableEditableField,
): boolean {
  return modifiedFields.has(makeModifiedFieldKey(id, field));
}
