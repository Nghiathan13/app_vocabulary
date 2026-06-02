import type { WordId } from "../../../entities/word/model/types";

export type TableSortColumn = "word";

export type TableEditableField =
  | "word"
  | "ipa"
  | "type"
  | "meaning_vi"
  | "level"
  | "last_review"
  | "next_review";

export interface TableActiveCell {
  id: WordId;
  field: TableEditableField;
}
