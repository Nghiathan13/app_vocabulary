// -- React --
import { useEffect, useRef, useState } from "react";

// -- Library --
import { useVirtualizer } from "@tanstack/react-virtual";

// -- Tauri --
import { invoke } from "@tauri-apps/api/core";

// -- Types & Utils --
import { WordWithId } from "../../../entities/word/model/types";
import { IconButton } from "../../../shared/ui/Button/Button";
import Icon from "../../../shared/ui/Icon/Icon";
import { formatDisplayDate, getAudioPath } from "../../../shared/lib/utils";

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

export default function TableGrid({
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
  const [hoveredCell, setHoveredCell] = useState<TableActiveCell | null>(null);

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

  const isHoveredCell = (id: number, field: TableEditableField) =>
    hoveredCell?.id === id && hoveredCell.field === field;

  const isEditableInputCell = (id: number, field: TableEditableField) =>
    isActiveCell(id, field) || isHoveredCell(id, field);

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

    setHoveredCell(null);
    onCellActivate({ id, field });
  };

  const handleCellHover = (id: number, field: TableEditableField) => {
    if (!isEditing || isActiveCell(id, field) || isHoveredCell(id, field)) {
      return;
    }

    setHoveredCell({ id, field });
  };

  const handleInputFocus = (cell: TableActiveCell) => {
    setHoveredCell(null);
    onCellActivate(cell);
  };

  const handleInputBlur = () => {
    onCellDeactivate();
  };

  useEffect(() => {
    if (!isEditing) {
      setHoveredCell(null);
    }
  }, [isEditing]);

  // === RENDER ===
  return (
    <div className={`word-grid-main-wrapper ${isEditing ? "is-editing" : ""}`}>
      <div className="grid-header-row">
        <div
          className="grid-header sortable-th"
          onClick={() => onSortToggle("word")}
        >
          <span>Word</span>
          {sortColumn === "word" && (
            <Icon name="sort" className={`sort-icon sort-icon-${sortOrder}`} />
          )}
        </div>

        <div className="grid-header">IPA</div>

        <div className="grid-header">Type</div>

        <div className="grid-header">Meaning</div>

        <div className="grid-header">Level</div>

        <div className="grid-header">Next Review</div>

        <div className="grid-header audio-th"></div>
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
                <div
                  className={getCellClassName(w.id, "word")}
                  onClick={() => handleCellClick(w.id, "word")}
                  onMouseEnter={() => handleCellHover(w.id, "word")}
                >
                  {isEditing && isEditableInputCell(w.id, "word") ? (
                    <textarea
                      className={`table-input${modifiedFields.has(`${w.id}-word`) ? " modified" : ""}`}
                      value={w.word}
                      onChange={(e) => onInputChange(w.id, "word", e.target.value)}
                      onFocus={() => handleInputFocus({ id: w.id, field: "word" })}
                      onBlur={handleInputBlur}
                      spellCheck={false}
                    />
                  ) : (
                    w.word
                  )}
                </div>

                <div
                  className={getCellClassName(w.id, "ipa")}
                  onClick={() => handleCellClick(w.id, "ipa")}
                  onMouseEnter={() => handleCellHover(w.id, "ipa")}
                >
                  {isEditing && isEditableInputCell(w.id, "ipa") ? (
                    <span className="ipa-edit-display">
                      {w.hasAudio && (
                        <button
                          className="table-audio-btn active"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.stopPropagation(); playAudio(w.word); }}
                        >
                          <span className="material-symbols-outlined">volume_up</span>
                        </button>
                      )}
                      <textarea
                        className={`table-input${modifiedFields.has(`${w.id}-ipa`) ? " modified" : ""}`}
                        value={w.ipa || ""}
                        onChange={(e) =>
                          onInputChange(w.id, "ipa", e.target.value || null)
                        }
                        onFocus={() => handleInputFocus({ id: w.id, field: "ipa" })}
                        onBlur={handleInputBlur}
                        spellCheck={false}
                      />
                    </span>
                  ) : (
                    <span className="ipa-display">
                      {w.hasAudio && (
                        <button
                          className="table-audio-btn active"
                          onClick={(e) => { e.stopPropagation(); playAudio(w.word); }}
                        >
                          <span className="material-symbols-outlined">volume_up</span>
                        </button>
                      )}
                      {w.ipa && <span className="ipa-text">{w.ipa}</span>}
                    </span>
                  )}
                </div>

                <div
                  className={getCellClassName(w.id, "type")}
                  onClick={() => handleCellClick(w.id, "type")}
                  onMouseEnter={() => handleCellHover(w.id, "type")}
                >
                  {isEditing && isEditableInputCell(w.id, "type") ? (
                    <textarea
                      className={`table-input${modifiedFields.has(`${w.id}-type`) ? " modified" : ""}`}
                      value={w.type || ""}
                      onChange={(e) =>
                        onInputChange(w.id, "type", e.target.value || null)
                      }
                      onFocus={() => handleInputFocus({ id: w.id, field: "type" })}
                      onBlur={handleInputBlur}
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
                  className={getCellClassName(w.id, "meaning_vi")}
                  onClick={() => handleCellClick(w.id, "meaning_vi")}
                  onMouseEnter={() => handleCellHover(w.id, "meaning_vi")}
                >
                  {isEditing && isEditableInputCell(w.id, "meaning_vi") ? (
                    <textarea
                      className={`table-input${modifiedFields.has(`${w.id}-meaning_vi`) ? " modified" : ""}`}
                      value={w.meaning_vi}
                      onChange={(e) =>
                        onInputChange(w.id, "meaning_vi", e.target.value)
                      }
                      onFocus={() => handleInputFocus({ id: w.id, field: "meaning_vi" })}
                      onBlur={handleInputBlur}
                      spellCheck={false}
                    />
                  ) : (
                    w.meaning_vi
                  )}
                </div>

                <div
                  className={getCellClassName(w.id, "level")}
                  onClick={() => handleCellClick(w.id, "level")}
                  onMouseEnter={() => handleCellHover(w.id, "level")}
                >
                  {isEditing && isEditableInputCell(w.id, "level") ? (
                    <input
                      type="number"
                      className={`table-input${modifiedFields.has(`${w.id}-level`) ? " modified" : ""}`}
                      value={w.level}
                      min={0}
                      onChange={(e) =>
                        onInputChange(w.id, "level", parseInt(e.target.value) || 0)
                      }
                      onFocus={() => handleInputFocus({ id: w.id, field: "level" })}
                      onBlur={handleInputBlur}
                    />
                  ) : (
                    w.level
                  )}
                </div>

                <div
                  className={getCellClassName(w.id, "next_review")}
                  onClick={() => handleCellClick(w.id, "next_review")}
                  onMouseEnter={() => handleCellHover(w.id, "next_review")}
                >
                  {isEditing && isEditableInputCell(w.id, "next_review") ? (
                    <input
                      type="date"
                      className={`table-input${modifiedFields.has(`${w.id}-next_review`) ? " modified" : ""}`}
                      value={w.next_review || ""}
                      onChange={(e) =>
                        onInputChange(w.id, "next_review", e.target.value || null)
                      }
                      onFocus={() => handleInputFocus({ id: w.id, field: "next_review" })}
                      onBlur={handleInputBlur}
                    />
                  ) : (
                    formatDisplayDate(w.next_review)
                  )}
                </div>

                <div className="grid-cell audio-cell">
                  {isEditing && (
                    <IconButton
                      type="button"
                      className="table-delete-btn"
                      icon="delete"
                      label="Delete"
                      onClick={() => onDelete(w.id, w.word)}
                    />
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
