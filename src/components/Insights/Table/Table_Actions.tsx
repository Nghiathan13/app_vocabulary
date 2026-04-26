import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import Database from "@tauri-apps/plugin-sql";
import * as XLSX from "xlsx";
import { WordWithId } from "../../../types";
import ImportModal from "./Table_Import";
import { buildImportPreviewFiles, ImportPreviewFile } from "./_tableImport";

interface TableActionsProps {
  isEditing: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onRefresh: () => void;
  existingWords: WordWithId[];
  wordsToExport: WordWithId[];
}

export default function Table_Actions({
  isEditing,
  searchInput,
  onSearchChange,
  onClearSearch,
  onEdit,
  onSave,
  onCancel,
  onRefresh,
  existingWords,
  wordsToExport,
}: TableActionsProps) {
  // === STATE ===
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPaths, setImportPaths] = useState<string[]>([]);
  const [importPreviewFiles, setImportPreviewFiles] = useState<
    ImportPreviewFile[]
  >([]);
  const [isScanningImportFiles, setIsScanningImportFiles] = useState(false);
  const [isAddingImportedWords, setIsAddingImportedWords] = useState(false);

  // === DERIVED STATE ===
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
      return;
    }

    const selectedPaths = Array.isArray(selected) ? selected : [selected];
    setImportPaths((prev) => mergeUniquePaths([...prev, ...selectedPaths]));
  };

  const handleOpenImportModal = async () => {
    setIsImportModalOpen(true);
    await handlePickImportFiles();
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

  return (
    <>
      {/* === TABLE ACTION === */}
      <div className="table-actions">
        <div className="table-actions-side table-actions-left">
          {!isEditing ? (
            <div className="edit-group">
              <button className="edit-btn" onClick={handleOpenImportModal}>
                Import
              </button>
              <button className="edit-btn" onClick={handleExportClick}>
                Export
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
              <button className="edit-btn" onClick={onEdit}>
                Edit
              </button>
            </div>
          ) : (
            <div className="edit-group">
              <button className="save-btn" onClick={onSave}>
                Save
              </button>
              <button className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === IMPORT MODAL === */}
      <ImportModal
        isOpen={isImportModalOpen}
        files={importPreviewFiles}
        isScanning={isScanningImportFiles}
        isAdding={isAddingImportedWords}
        canAdd={canAddImportedWords}
        onAdd={handleAddImportedWords}
        onClose={handleCloseImportModal}
        onPickFiles={handlePickImportFiles}
        onRemoveFile={handleRemoveImportFile}
      />
    </>
  );
}
