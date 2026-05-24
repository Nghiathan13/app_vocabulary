// -- React --
import { useCallback, useEffect, useMemo, useState } from "react";

// -- Tauri --
import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";

// -- Components --
import Table_Actions from "./Table_Actions";
import Table_Grid, {
  TableActiveCell,
  TableEditableField,
  TableSortColumn,
} from "./Table_Grid";

// -- Types & Utils --
import { WordWithId } from "../../../../entities/word/model/types";
import { getAudioPath } from "../../../../shared/lib/utils";
import {
  getSearchMatchColumn,
  getSearchPriority,
  type SearchMatchColumn,
} from "../../lib/tableSearch";

// -- Style --
import "./Table.css";

const SEARCH_DELAY_MS = 100;

interface TableProps {
  words: WordWithId[];
  onRefresh: () => void;
  onWordDeleted: (wordId: number) => void;
}

const normalizeComparableValue = (
  field: TableEditableField,
  value: WordWithId[TableEditableField],
) => {
  if (field === "word" || field === "reps") {
    return value;
  }

  return value || null;
};

export default function Table({
  words,
  onRefresh,
  onWordDeleted,
}: TableProps) {
  // === STATE ===
  const [isEditing, setIsEditing] = useState(false);
  const [editedWords, setEditedWords] = useState<WordWithId[]>([]);
  const [sortColumn, setSortColumn] = useState<TableSortColumn>("word");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<TableActiveCell | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");

  // === DERIVED STATE ===
  const sortedWords = useMemo(() => {
    const source = isEditing ? editedWords : words;
    return [...source].sort((a, b) => {
      if (sortColumn === "reps") {
        return sortOrder === "asc" ? a.reps - b.reps : b.reps - a.reps;
      }

      const valA = (a[sortColumn] || "").toLowerCase();
      const valB = (b[sortColumn] || "").toLowerCase();

      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [isEditing, editedWords, words, sortColumn, sortOrder]);

  const displayedWords = useMemo(() => {
    if (!debouncedSearchInput) {
      return sortedWords;
    }

    return sortedWords
      .map((word) => ({
        word,
        matchColumn: getSearchMatchColumn(word, debouncedSearchInput),
      }))
      .filter(
        (
          item,
        ): item is {
          word: WordWithId;
          matchColumn: Exclude<SearchMatchColumn, null>;
        } => item.matchColumn !== null,
      )
      .sort(
        (a, b) =>
          getSearchPriority(a.matchColumn) - getSearchPriority(b.matchColumn),
      )
      .map((item) => item.word);
  }, [sortedWords, debouncedSearchInput]);

  // === HANDLERS ===
  // -- Edit --
  const handleEditClick = useCallback(() => {
    setEditedWords(words.map((word) => ({ ...word })));
    setModifiedFields(new Set());
    setActiveCell(null);
    setIsEditing(true);
  }, [words]);

  const handleCancelClick = useCallback(() => {
    setIsEditing(false);
    setEditedWords([]);
    setModifiedFields(new Set());
    setActiveCell(null);
  }, []);

  const handleSaveClick = useCallback(async () => {
    try {
      const db = await Database.load("sqlite:vocabulary.db");

      const modifiedIds = new Set<number>();
      for (const field of modifiedFields) {
        modifiedIds.add(Number(field.split("-")[0]));
      }

      const wordsToUpdate = editedWords.filter((word) =>
        modifiedIds.has(word.id),
      );

      for (const word of wordsToUpdate) {
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
      setEditedWords([]);
      setModifiedFields(new Set());
      setActiveCell(null);
      onRefresh();
    } catch (error) {
      console.error("Error saving words:", error);
    }
  }, [editedWords, modifiedFields, onRefresh]);

  const handleInputChange = useCallback(
    (
      id: number,
      field: TableEditableField,
      value: WordWithId[TableEditableField],
    ) => {
      const originalWord = words.find((word) => word.id === id);

      if (!originalWord) {
        return;
      }

      const nextValue = normalizeComparableValue(field, value);
      const originalValue = normalizeComparableValue(
        field,
        originalWord[field],
      );
      const fieldKey = `${id}-${field}`;

      setModifiedFields((prev) => {
        const next = new Set(prev);

        if (nextValue === originalValue) {
          next.delete(fieldKey);
        } else {
          next.add(fieldKey);
        }

        return next;
      });

      setEditedWords((prev) =>
        prev.map((word) =>
          word.id === id ? { ...word, [field]: nextValue } : word,
        ),
      );
    },
    [words],
  );

  const handleDelete = useCallback(
    async (id: number, word: string) => {
      try {
        const db = await Database.load("sqlite:vocabulary.db");

        // 1. Delete from Database
        await db.execute("DELETE FROM words WHERE rowid = $1", [id]);

        // 2. Delete Audio File
        try {
          const audioPath = await getAudioPath(word);
          await invoke("remove_file", { path: audioPath });
        } catch (fileError) {
          // Ignore if file doesn't exist or can't be deleted
          console.warn("Could not delete audio file:", fileError);
        }

        // 3. Update global state
        onWordDeleted(id);

        // If we are editing, update the editedWords state too
        if (isEditing) {
          setEditedWords((prev) => prev.filter((w) => w.id !== id));
        }
      } catch (error) {
        console.error("Error deleting word:", error);
      }
    },
    [isEditing, onWordDeleted],
  );

  // -- Search --
  const handleSortToggle = useCallback(
    (col: TableSortColumn) => {
      if (sortColumn === col) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(col);
        setSortOrder("asc");
      }
    },
    [sortColumn],
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setDebouncedSearchInput("");
  }, []);

  // === EFFECTS ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        if (!isEditing) {
          handleEditClick();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, handleEditClick]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchInput(searchInput.trim());
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  // === RENDER ===
  return (
    <div className="table-wrapper">
      <Table_Actions
        isEditing={isEditing}
        hasChanges={modifiedFields.size > 0}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onClearSearch={handleClearSearch}
        onEdit={handleEditClick}
        onSave={handleSaveClick}
        onCancel={handleCancelClick}
        onRefresh={onRefresh}
        existingWords={words}
        wordsToExport={displayedWords}
        editedWords={editedWords}
        modifiedFields={modifiedFields}
      />

      <Table_Grid
        words={displayedWords}
        isEditing={isEditing}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        modifiedFields={modifiedFields}
        activeCell={activeCell}
        onSortToggle={handleSortToggle}
        onInputChange={handleInputChange}
        onCellActivate={setActiveCell}
        onCellDeactivate={() => setActiveCell(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
