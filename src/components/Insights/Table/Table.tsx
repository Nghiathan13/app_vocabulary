import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import Database from "@tauri-apps/plugin-sql";
import * as XLSX from "xlsx";
import { WordWithId } from "../../../types";
import "./Table.css";

interface TableProps {
  words: WordWithId[];
  onRefresh: () => void;
}

export default function Table({ words, onRefresh }: TableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedWords, setEditedWords] = useState<WordWithId[]>([]);
  const [sortColumn, setSortColumn] = useState<
    "word" | "type" | "reps" | "last_review" | "next_review"
  >("word");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  const handleEditClick = () => {
    setEditedWords(JSON.parse(JSON.stringify(words)));
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedWords([]);
    setModifiedFields(new Set());
  };

  const handleSaveClick = async () => {
    try {
      const db = await Database.load("sqlite:vocabulary.db");
      for (const word of editedWords) {
        await db.execute(
          "UPDATE words SET word = $1, ipa = $2, type = $3, meaning = $4, reps = $5, last_review = $6, next_review = $7 WHERE rowid = $8",
          [
            word.word,
            word.ipa,
            word.type,
            word.meaning,
            word.reps,
            word.last_review,
            word.next_review,
            word.id,
          ],
        );
      }
      setIsEditing(false);
      setModifiedFields(new Set());
      onRefresh();
    } catch (error) {
      console.error("Error saving words:", error);
    }
  };

  const handleExportClick = async () => {
    try {
      const filePath = await save({
        title: "Export Excel File",
        defaultPath: "engvocab.xlsx",
        filters: [
          {
            name: "Excel Workbook",
            extensions: ["xlsx"],
          },
        ],
      });

      if (!filePath) {
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        sortedWords.map((word) => ({
          Word: word.word,
          IPA: word.ipa ?? "",
          Type: word.type ?? "",
          Meaning: word.meaning ?? "",
          Reps: word.reps,
          "Last Review": word.last_review ?? "",
          "Next Review": word.next_review ?? "",
        })),
      );
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Words");

      const workbookBytes = new Uint8Array(
        XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        }),
      );

      await invoke("write_binary_file", {
        path: filePath,
        bytes: Array.from(workbookBytes),
      });
    } catch (error) {
      console.error("Error exporting words:", error);
    }
  };

  const handleInputChange = (
    id: number,
    field: keyof WordWithId,
    value: any,
  ) => {
    setModifiedFields((prev) => new Set(prev).add(`${id}-${field}`));
    setEditedWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    );
  };

  const handleSortToggle = (
    col: "word" | "type" | "reps" | "last_review" | "next_review",
  ) => {
    if (sortColumn === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortOrder("asc");
    }
  };

  const sortedWords = [...(isEditing ? editedWords : words)].sort((a, b) => {
    if (sortColumn === "reps") {
      return sortOrder === "asc" ? a.reps - b.reps : b.reps - a.reps;
    }
    const valA = (a[sortColumn] || "").toLowerCase();
    const valB = (b[sortColumn] || "").toLowerCase();
    return sortOrder === "asc"
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  return (
    <div className="table-wrapper">
      <div className="table-actions">
        {!isEditing ? (
          <div className="edit-group">
            <button className="edit-btn" onClick={handleExportClick}>
              Export
            </button>
            <button className="edit-btn" onClick={handleEditClick}>
              Edit
            </button>
          </div>
        ) : (
          <div className="edit-group">
            <button className="save-btn" onClick={handleSaveClick}>
              Save
            </button>
            <button className="cancel-btn" onClick={handleCancelClick}>
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="word-grid">
        {/* Header */}
        <div
          className="grid-header sortable-th"
          onClick={() => handleSortToggle("word")}
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
          onClick={() => handleSortToggle("type")}
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
          onClick={() => handleSortToggle("reps")}
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
          onClick={() => handleSortToggle("last_review")}
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
          onClick={() => handleSortToggle("next_review")}
        >
          Next Review{" "}
          {sortColumn === "next_review" && (
            <span className="material-symbols-outlined sort-icon">
              {sortOrder === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
            </span>
          )}
        </div>

        {/* Rows */}
        {sortedWords.map((w) => (
          <div key={w.id} style={{ display: "contents" }}>
            <div className="grid-cell">
              {isEditing ? (
                <textarea
                  className={`table-input${modifiedFields.has(`${w.id}-word`) ? " modified" : ""}`}
                  value={w.word}
                  onChange={(e) =>
                    handleInputChange(w.id, "word", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleInputChange(w.id, "ipa", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleInputChange(w.id, "type", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleInputChange(w.id, "meaning", e.target.value)
                  }
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
                    handleInputChange(
                      w.id,
                      "reps",
                      parseInt(e.target.value) || 0,
                    )
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
                    handleInputChange(
                      w.id,
                      "last_review",
                      e.target.value || null,
                    )
                  }
                />
              ) : w.last_review ? (
                w.last_review
                  .split("-")
                  .slice(1)
                  .concat(w.last_review.split("-")[0])
                  .join("/")
              ) : (
                "-"
              )}
            </div>
            <div className="grid-cell">
              {isEditing ? (
                <input
                  type="date"
                  className={`table-input${modifiedFields.has(`${w.id}-next_review`) ? " modified" : ""}`}
                  value={w.next_review || ""}
                  onChange={(e) =>
                    handleInputChange(
                      w.id,
                      "next_review",
                      e.target.value || null,
                    )
                  }
                />
              ) : w.next_review ? (
                w.next_review
                  .split("-")
                  .slice(1)
                  .concat(w.next_review.split("-")[0])
                  .join("/")
              ) : (
                "-"
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
