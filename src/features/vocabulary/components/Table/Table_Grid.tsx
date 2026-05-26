// -- React --
import { useRef } from "react";

// -- Library --
import { useVirtualizer } from "@tanstack/react-virtual";

// -- Tauri --
import { invoke } from "@tauri-apps/api/core";

// -- Types & Utils --
import { WordWithId } from "../../../../entities/word/model/types";
import { formatDisplayDate, getAudioPath } from "../../../../shared/lib/utils";

export type TableSortColumn =
  | "word"
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
  onDelete: (id: number, word: string) => void;
}

const moveTextareaCaretToEnd = (
  event: React.FocusEvent<HTMLTextAreaElement>,
) => {
  const { value } = event.target;

  window.requestAnimationFrame(() => {
    event.target.setSelectionRange(value.length, value.length);
  });
};

const getTypePillClassName = (type: string | null) => {
  const normalizedType = type?.trim().toLowerCase() || "";

  if (normalizedType.includes("phrasal")) {
    return "type-pill-table type-pill-phrasal";
  }

  if (normalizedType === "adverb" || normalizedType === "adv") {
    return "type-pill-table type-pill-adverb";
  }

  if (normalizedType === "preposition" || normalizedType === "prep") {
    return "type-pill-table type-pill-preposition";
  }

  if (normalizedType === "noun") {
    return "type-pill-table type-pill-noun";
  }

  if (normalizedType === "adjective" || normalizedType === "adj") {
    return "type-pill-table type-pill-adjective";
  }

  if (normalizedType === "verb") {
    return "type-pill-table type-pill-verb";
  }

  return "type-pill-table type-pill-default";
};

const splitTypeLabels = (type: string | null) => {
  return (type || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
};

const formatTypeLabel = (type: string | null) => {
  if (!type) {
    return "";
  }

  return type
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  onDelete,
}: TableGridProps) {
  // === REFS ===
  const parentRef = useRef<HTMLDivElement>(null);

  // === STATE ===
  const rowVirtualizer = useVirtualizer({
    count: words.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
    getItemKey: (index) => words[index].id,
  });

  // === FUNCTIONS ===
  const isActiveCell = (id: number, field: TableEditableField) =>
    activeCell?.id === id && activeCell.field === field;

  const getCellClassName = (id: number, field: TableEditableField) => {
    const classes = ["grid-cell"];

    if (modifiedFields.has(`${id}-${field}`)) {
      classes.push("modified-cell");
    }

    if (isActiveCell(id, field)) {
      classes.push("active-cell");
    }

    return classes.join(" ");
  };

  const playAudio = async (word: string) => {
    try {
      const audioPath = await getAudioPath(word);

      const binaryData = await invoke<number[]>("read_binary_file", { path: audioPath });
      const blob = new Blob([new Uint8Array(binaryData)], { type: "audio/mpeg" });
      const assetUrl = URL.createObjectURL(blob);

      const audio = new Audio(assetUrl);
      audio.play();
    } catch (error) {
      console.error("Lỗi phát âm thanh trong bảng:", error);
    }
  };

  // === HANDLERS ===
  const handleCellClick = (id: number, field: TableEditableField) => {
    if (!isEditing || isActiveCell(id, field)) {
      return;
    }

    onCellActivate({ id, field });
  };

  // === RENDER ===
  return (
    <div className={`word-grid-main-wrapper ${isEditing ? "is-editing" : ""}`}>
      <div className="grid-header-row">
        <div className="grid-header audio-th"></div>
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

        <div className="grid-header">Type</div>

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
      </div>

      <div
        ref={parentRef}
        className={`word-grid-container ${isEditing ? "is-editing" : ""}`}
      >
        <div
          className="word-grid-inner"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const w = words[virtualRow.index];
            return (
              <div
                key={w.id}
                className="word-grid-row"
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="grid-cell audio-cell">
                  {isEditing ? (
                    <button
                      className="table-delete-btn"
                      onClick={() => onDelete(w.id, w.word)}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  ) : (
                    <button
                      className={`table-audio-btn ${w.hasAudio ? "active" : "disabled"}`}
                      onClick={() => w.hasAudio && playAudio(w.word)}
                    >
                      <span className="material-symbols-outlined">volume_up</span>
                    </button>
                  )}
                </div>
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
                  ) : w.type ? (
                    <span className="type-pill-list">
                      {splitTypeLabels(w.type).map((typePart) => (
                        <span
                          className={getTypePillClassName(typePart)}
                          key={`${w.id}-${typePart}`}
                        >
                          {formatTypeLabel(typePart)}
                        </span>
                      ))}
                    </span>
                  ) : (
                    ""
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
                    formatDisplayDate(w.last_review)
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
                    formatDisplayDate(w.next_review)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
