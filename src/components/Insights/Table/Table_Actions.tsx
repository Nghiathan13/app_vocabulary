// -- React --
import { useEffect, useMemo, useState } from "react";

// -- Library --
import * as XLSX from "xlsx";

// -- Tauri --
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import Database from "@tauri-apps/plugin-sql";

// -- Components --
import ImportModal from "./Table_Import";
import SaveModal, { WordChange } from "./Table_SaveModal";

// -- Types & Utils --
import { WordWithId } from "../../../entities/word/model/types";
import { buildImportPreviewFiles, ImportPreviewFile } from "./_tableImport";
import { TableEditableField } from "./Table_Grid";

interface TableActionsProps {
  isEditing: boolean;
  hasChanges: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onRefresh: () => void;
  existingWords: WordWithId[];
  wordsToExport: WordWithId[];
  editedWords: WordWithId[];
  modifiedFields: Set<string>;
}

export default function Table_Actions({
  isEditing,
  hasChanges,
  searchInput,
  onSearchChange,
  onClearSearch,
  onEdit,
  onSave,
  onCancel,
  onRefresh,
  existingWords,
  wordsToExport,
  editedWords,
  modifiedFields,
}: TableActionsProps) {
  // === STATE ===
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPaths, setImportPaths] = useState<string[]>([]);
  const [importPreviewFiles, setImportPreviewFiles] = useState<
    ImportPreviewFile[]
  >([]);
  const [isScanningImportFiles, setIsScanningImportFiles] = useState(false);
  const [isAddingImportedWords, setIsAddingImportedWords] = useState(false);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // === DERIVED STATE ===
  const changes = useMemo<WordChange[]>(() => {
    const list: WordChange[] = [];

    modifiedFields.forEach((fieldKey) => {
      const [idStr, field] = fieldKey.split("-");
      const id = Number(idStr);
      const originalWord = existingWords.find((w) => w.id === id);
      const editedWord = editedWords.find((w) => w.id === id);

      if (originalWord && editedWord) {
        list.push({
          word: originalWord.word,
          field,
          oldValue: String(originalWord[field as TableEditableField] ?? ""),
          newValue: String(editedWord[field as TableEditableField] ?? ""),
        });
      }
    });

    return list.sort((a, b) => a.word.localeCompare(b.word));
  }, [modifiedFields, existingWords, editedWords]);

  const canAddImportedWords =
    !isScanningImportFiles &&
    !isAddingImportedWords &&
    importPreviewFiles.length > 0 &&
    importPreviewFiles.every((file) => file.isValid);

  // === HANDLERS ===
  // -- Export --
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
        wordsToExport.map((word) => ({
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

  // -- Import --
  const mergeUniquePaths = (paths: string[]) => Array.from(new Set(paths));

  const handlePickImportFiles = async () => {
    const selected = await open({
      title: "Select files to import",
      multiple: true,
    });

    if (!selected) {
      return null;
    }

    return Array.isArray(selected) ? selected : [selected];
  };

  const handleOpenImportModal = async () => {
    const selectedPaths = await handlePickImportFiles();
    if (selectedPaths) {
      setImportPaths(selectedPaths);
      setIsImportModalOpen(true);
    }
  };

  const handleAddMoreFiles = async () => {
    const selectedPaths = await handlePickImportFiles();
    if (selectedPaths) {
      setImportPaths((prev) => mergeUniquePaths([...prev, ...selectedPaths]));
    }
  };

  const handleConfirmSave = async () => {
    await onSave();
    setIsSaveModalOpen(false);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportPaths([]);
    setImportPreviewFiles([]);
    setIsScanningImportFiles(false);
    setIsAddingImportedWords(false);
  };

  const handleRemoveImportFile = (path: string) => {
    setImportPaths((prev) => prev.filter((item) => item !== path));
  };

  const handleAddImportedWords = async () => {
    if (isAddingImportedWords) return;

    let db: Awaited<ReturnType<typeof Database.load>> | null = null;
    let hasTransaction = false;

    try {
      setIsAddingImportedWords(true);

      db = await Database.load("sqlite:vocabulary.db");
      const draftWords = importPreviewFiles.flatMap((file) => file.draftWords);

      await db.execute("BEGIN TRANSACTION");
      hasTransaction = true;

      for (const word of draftWords) {
        await db.execute(
          `INSERT OR IGNORE INTO words (
            word,
            ipa,
            type,
            meaning,
            reps,
            last_review,
            next_review
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            0,
            NULL,
            date('now', 'localtime', '+1 day')
          )`,
          [word.word, word.ipa, word.type, word.meaning],
        );
      }

      await db.execute("COMMIT");
      hasTransaction = false;

      handleCloseImportModal();
      onRefresh();
    } catch (error) {
      if (db && hasTransaction) {
        try {
          await db.execute("ROLLBACK");
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
      }

      console.error("Error importing words:", error);
      setIsAddingImportedWords(false);
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    if (!isImportModalOpen) {
      return;
    }

    let isActive = true;

    const scanFiles = async () => {
      setIsScanningImportFiles(true);

      const previews = await buildImportPreviewFiles(
        importPaths,
        existingWords,
      );

      if (!isActive) {
        return;
      }

      setImportPreviewFiles(previews);
      setIsScanningImportFiles(false);
    };

    void scanFiles();

    return () => {
      isActive = false;
    };
  }, [importPaths, isImportModalOpen, existingWords]);

  // === RENDER ===
  return (
    <>
      <div className="table-actions">
        <div className="table-actions-side table-actions-left">
          {!isEditing ? (
            <div className="edit-group">
              <button
                className="edit-btn has-tooltip tooltip-left"
                onClick={handleOpenImportModal}
                data-tooltip="Import"
                aria-label="Import"
              >
                <span className="material-symbols-outlined">upload</span>
              </button>
              <button
                className="edit-btn has-tooltip tooltip-center"
                onClick={handleExportClick}
                data-tooltip="Export"
                aria-label="Export"
              >
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="table-actions-center">
          <div className="table-search">
            <input
              className="table-search-input"
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              spellCheck={false}
            />
            {searchInput && (
              <button
                className="table-search-clear"
                onClick={onClearSearch}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="table-actions-side table-actions-right">
          {!isEditing ? (
            <div className="edit-group">
              <button
                className="edit-btn has-tooltip tooltip-right"
                onClick={onEdit}
                data-tooltip="Edit (Ctrl+E)"
                aria-label="Edit"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
          ) : (
            <div className="edit-group">
              {hasChanges && (
                <button
                  className="save-btn has-tooltip tooltip-center"
                  onClick={() => setIsSaveModalOpen(true)}
                  data-tooltip="Save"
                  aria-label="Save"
                >
                  <span className="material-symbols-outlined">check</span>
                </button>
              )}
              <button
                className="cancel-btn has-tooltip tooltip-right"
                onClick={onCancel}
                data-tooltip="Cancel"
                aria-label="Cancel"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        files={importPreviewFiles}
        isScanning={isScanningImportFiles}
        isAdding={isAddingImportedWords}
        canAdd={canAddImportedWords}
        onAdd={handleAddImportedWords}
        onClose={handleCloseImportModal}
        onPickFiles={handleAddMoreFiles}
        onRemoveFile={handleRemoveImportFile}
      />

      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSave}
        changes={changes}
      />
    </>
  );
}
