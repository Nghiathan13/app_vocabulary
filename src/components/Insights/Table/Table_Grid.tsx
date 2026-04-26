import { WordWithId } from "../../../types";

export type TableSortColumn =
  | "word"
  | "type"
  | "reps"
  | "last_review"
  | "next_review";

interface TableGridProps {
  words: WordWithId[];
  isEditing: boolean;
  sortColumn: TableSortColumn;
  sortOrder: "asc" | "desc";
  modifiedFields: Set<string>;
  onSortToggle: (col: TableSortColumn) => void;
  onInputChange: (id: number, field: keyof WordWithId, value: any) => void;
}

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return value.split("-").slice(1).concat(value.split("-")[0]).join("/");
};

export default function Table_Grid({
  words,
  isEditing,
  sortColumn,
  sortOrder,
  modifiedFields,
  onSortToggle,
  onInputChange,
}: TableGridProps) {
  return (
    <div className="word-grid">
      <div
        className="grid-header sortable-th"
        onClick={() => onSortToggle("word")}
      >
        Word{" "}
        {sortColumn === "word" && (
          <span className="material-symbols-outlined sort-icon">
            {sortOrder === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
          </span>
        )}
      </div>

      <div className="grid-header">IPA</div>

      <div
        className="grid-header sortable-th"
        onClick={() => onSortToggle("type")}
      >
        Type{" "}
        {sortColumn === "type" && (
          <span className="material-symbols-outlined sort-icon">
            {sortOrder === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
          </span>
        )}
      </div>

      <div className="grid-header">Meaning</div>

      <div
        className="grid-header sortable-th"
        onClick={() => onSortToggle("reps")}
      >
        Reps{" "}
        {sortColumn === "reps" && (
          <span className="material-symbols-outlined sort-icon">
            {sortOrder === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
          </span>
        )}
      </div>

      <div
        className="grid-header sortable-th"
        onClick={() => onSortToggle("last_review")}
      >
        Last Review{" "}
        {sortColumn === "last_review" && (
          <span className="material-symbols-outlined sort-icon">
            {sortOrder === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
          </span>
        )}
      </div>

      <div
        className="grid-header sortable-th"
        onClick={() => onSortToggle("next_review")}
      >
        Next Review{" "}
        {sortColumn === "next_review" && (
          <span className="material-symbols-outlined sort-icon">
            {sortOrder === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
          </span>
        )}
      </div>

      {words.map((w) => (
        <div key={w.id} style={{ display: "contents" }}>
          <div className="grid-cell">
            {isEditing ? (
              <textarea
                className={`table-input${modifiedFields.has(`${w.id}-word`) ? " modified" : ""}`}
                value={w.word}
                onChange={(e) => onInputChange(w.id, "word", e.target.value)}
                spellCheck={false}
              />
            ) : (
              w.word
            )}
          </div>

          <div className="grid-cell">
            {isEditing ? (
              <textarea
                className={`table-input${modifiedFields.has(`${w.id}-ipa`) ? " modified" : ""}`}
                value={w.ipa || ""}
                onChange={(e) => onInputChange(w.id, "ipa", e.target.value)}
                spellCheck={false}
              />
            ) : (
              w.ipa
            )}
          </div>

          <div className="grid-cell">
            {isEditing ? (
              <textarea
                className={`table-input${modifiedFields.has(`${w.id}-type`) ? " modified" : ""}`}
                value={w.type || ""}
                onChange={(e) => onInputChange(w.id, "type", e.target.value)}
                spellCheck={false}
              />
            ) : (
              w.type
            )}
          </div>

          <div className="grid-cell">
            {isEditing ? (
              <textarea
                className={`table-input${modifiedFields.has(`${w.id}-meaning`) ? " modified" : ""}`}
                value={w.meaning || ""}
                onChange={(e) => onInputChange(w.id, "meaning", e.target.value)}
                spellCheck={false}
              />
            ) : (
              w.meaning
            )}
          </div>

          <div className="grid-cell">
            {isEditing ? (
              <input
                type="number"
                className={`table-input${modifiedFields.has(`${w.id}-reps`) ? " modified" : ""}`}
                value={w.reps}
                min={0}
                onChange={(e) =>
                  onInputChange(w.id, "reps", parseInt(e.target.value) || 0)
                }
              />
            ) : (
              w.reps
            )}
          </div>

          <div className="grid-cell">
            {isEditing ? (
              <input
                type="date"
                className={`table-input${modifiedFields.has(`${w.id}-last_review`) ? " modified" : ""}`}
                value={w.last_review || ""}
                onChange={(e) =>
                  onInputChange(w.id, "last_review", e.target.value || null)
                }
              />
            ) : (
              formatDate(w.last_review)
            )}
          </div>

          <div className="grid-cell">
            {isEditing ? (
              <input
                type="date"
                className={`table-input${modifiedFields.has(`${w.id}-next_review`) ? " modified" : ""}`}
                value={w.next_review || ""}
                onChange={(e) =>
                  onInputChange(w.id, "next_review", e.target.value || null)
                }
              />
            ) : (
              formatDate(w.next_review)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
