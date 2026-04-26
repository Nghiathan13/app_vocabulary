import { WordWithId } from "../../../types";

export type TableSortColumn =
  | "word"
  | "type"
  | "reps"
  | "last_review"
  | "next_review";

export type TableEditableField =
  | "word"
  | "ipa"
  | "type"
  | "meaning"
  | "reps"
  | "last_review"
  | "next_review";

export interface TableActiveCell {
  id: number;
  field: TableEditableField;
}

interface TableGridProps {
  words: WordWithId[];
  isEditing: boolean;
  sortColumn: TableSortColumn;
  sortOrder: "asc" | "desc";
  modifiedFields: Set<string>;
  activeCell: TableActiveCell | null;
  onSortToggle: (col: TableSortColumn) => void;
  onInputChange: (
    id: number,
    field: TableEditableField,
    value: WordWithId[TableEditableField],
  ) => void;
  onCellActivate: (cell: TableActiveCell) => void;
  onCellDeactivate: () => void;
}

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return value.split("-").slice(1).concat(value.split("-")[0]).join("/");
};

const moveTextareaCaretToEnd = (
  event: React.FocusEvent<HTMLTextAreaElement>,
) => {
  const { value } = event.target;

  window.requestAnimationFrame(() => {
    event.target.setSelectionRange(value.length, value.length);
  });
};

export default function Table_Grid({
  words,
  isEditing,
  sortColumn,
  sortOrder,
  modifiedFields,
  activeCell,
  onSortToggle,
  onInputChange,
  onCellActivate,
  onCellDeactivate,
}: TableGridProps) {
  const isActiveCell = (id: number, field: TableEditableField) =>
    activeCell?.id === id && activeCell.field === field;

  const getCellClassName = (id: number, field: TableEditableField) => {
    const classes = ["grid-cell"];

    if (isEditing) {
      classes.push("editable-cell");
    }

    if (modifiedFields.has(`${id}-${field}`)) {
      classes.push("modified-cell");
    }

    if (isActiveCell(id, field)) {
      classes.push("active-cell");
    }

    return classes.join(" ");
  };

  const handleCellClick = (id: number, field: TableEditableField) => {
    if (!isEditing || isActiveCell(id, field)) {
      return;
    }

    onCellActivate({ id, field });
  };

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
          <div
            className={getCellClassName(w.id, "word")}
            onClick={() => handleCellClick(w.id, "word")}
          >
            {isEditing && isActiveCell(w.id, "word") ? (
              <textarea
                autoFocus
                className={`table-input${modifiedFields.has(`${w.id}-word`) ? " modified" : ""}`}
                value={w.word}
                onChange={(e) => onInputChange(w.id, "word", e.target.value)}
                onFocus={moveTextareaCaretToEnd}
                onBlur={onCellDeactivate}
                spellCheck={false}
              />
            ) : (
              w.word
            )}
          </div>

          <div
            className={getCellClassName(w.id, "ipa")}
            onClick={() => handleCellClick(w.id, "ipa")}
          >
            {isEditing && isActiveCell(w.id, "ipa") ? (
              <textarea
                autoFocus
                className={`table-input${modifiedFields.has(`${w.id}-ipa`) ? " modified" : ""}`}
                value={w.ipa || ""}
                onChange={(e) =>
                  onInputChange(w.id, "ipa", e.target.value || null)
                }
                onFocus={moveTextareaCaretToEnd}
                onBlur={onCellDeactivate}
                spellCheck={false}
              />
            ) : (
              w.ipa
            )}
          </div>

          <div
            className={getCellClassName(w.id, "type")}
            onClick={() => handleCellClick(w.id, "type")}
          >
            {isEditing && isActiveCell(w.id, "type") ? (
              <textarea
                autoFocus
                className={`table-input${modifiedFields.has(`${w.id}-type`) ? " modified" : ""}`}
                value={w.type || ""}
                onChange={(e) =>
                  onInputChange(w.id, "type", e.target.value || null)
                }
                onFocus={moveTextareaCaretToEnd}
                onBlur={onCellDeactivate}
                spellCheck={false}
              />
            ) : (
              w.type
            )}
          </div>

          <div
            className={getCellClassName(w.id, "meaning")}
            onClick={() => handleCellClick(w.id, "meaning")}
          >
            {isEditing && isActiveCell(w.id, "meaning") ? (
              <textarea
                autoFocus
                className={`table-input${modifiedFields.has(`${w.id}-meaning`) ? " modified" : ""}`}
                value={w.meaning || ""}
                onChange={(e) =>
                  onInputChange(w.id, "meaning", e.target.value || null)
                }
                onFocus={moveTextareaCaretToEnd}
                onBlur={onCellDeactivate}
                spellCheck={false}
              />
            ) : (
              w.meaning
            )}
          </div>

          <div
            className={getCellClassName(w.id, "reps")}
            onClick={() => handleCellClick(w.id, "reps")}
          >
            {isEditing && isActiveCell(w.id, "reps") ? (
              <input
                autoFocus
                type="number"
                className={`table-input${modifiedFields.has(`${w.id}-reps`) ? " modified" : ""}`}
                value={w.reps}
                min={0}
                onChange={(e) =>
                  onInputChange(w.id, "reps", parseInt(e.target.value) || 0)
                }
                onBlur={onCellDeactivate}
              />
            ) : (
              w.reps
            )}
          </div>

          <div
            className={getCellClassName(w.id, "last_review")}
            onClick={() => handleCellClick(w.id, "last_review")}
          >
            {isEditing && isActiveCell(w.id, "last_review") ? (
              <input
                autoFocus
                type="date"
                className={`table-input${modifiedFields.has(`${w.id}-last_review`) ? " modified" : ""}`}
                value={w.last_review || ""}
                onChange={(e) =>
                  onInputChange(w.id, "last_review", e.target.value || null)
                }
                onBlur={onCellDeactivate}
              />
            ) : (
              formatDate(w.last_review)
            )}
          </div>

          <div
            className={getCellClassName(w.id, "next_review")}
            onClick={() => handleCellClick(w.id, "next_review")}
          >
            {isEditing && isActiveCell(w.id, "next_review") ? (
              <input
                autoFocus
                type="date"
                className={`table-input${modifiedFields.has(`${w.id}-next_review`) ? " modified" : ""}`}
                value={w.next_review || ""}
                onChange={(e) =>
                  onInputChange(w.id, "next_review", e.target.value || null)
                }
                onBlur={onCellDeactivate}
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
