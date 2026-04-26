import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import { WordWithId } from "../../../types";
import Table_Actions from "./Table_Actions";
import Table_Grid, { TableSortColumn } from "./Table_Grid";
import {
  getSearchMatchColumn,
  getSearchPriority,
  type SearchMatchColumn,
} from "./_tableSearch";
import "./Table.css";

const SEARCH_DELAY_MS = 100;

interface TableProps {
  words: WordWithId[];
  onRefresh: () => void;
}

export default function Table({ words, onRefresh }: TableProps) {
  // === STATE ===
  const [isEditing, setIsEditing] = useState(false);
  const [editedWords, setEditedWords] = useState<WordWithId[]>([]);
  const [sortColumn, setSortColumn] = useState<TableSortColumn>("word");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");

  // === DERIVED STATE ===
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

  const displayedWords = (() => {
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
  })();

  // === HANDLERS ===
  // -- Edit --
  const handleEditClick = () => {
    setEditedWords(words.map((word) => ({ ...word })));
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
      onRefresh();
    } catch (error) {
      console.error("Error saving words:", error);
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

  // -- Search --
  const handleSortToggle = (col: TableSortColumn) => {
    if (sortColumn === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortOrder("asc");
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedSearchInput("");
  };

  // === EFFECTS ===
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchInput(searchInput.trim());
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  return (
    <div className="table-wrapper">
      <Table_Actions
        isEditing={isEditing}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onClearSearch={handleClearSearch}
        onEdit={handleEditClick}
        onSave={handleSaveClick}
        onCancel={handleCancelClick}
        onRefresh={onRefresh}
        existingWords={words}
        wordsToExport={displayedWords}
      />

      <Table_Grid
        words={displayedWords}
        isEditing={isEditing}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        modifiedFields={modifiedFields}
        onSortToggle={handleSortToggle}
        onInputChange={handleInputChange}
      />
    </div>
  );
}
