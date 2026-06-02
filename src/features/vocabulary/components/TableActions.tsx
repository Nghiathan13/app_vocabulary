// -- React --
import { useEffect, useMemo, useState } from "react";

// -- Tauri --
import { open, save } from "@tauri-apps/plugin-dialog";
// -- Components --
import { Button, IconButton } from "../../../shared/ui/Button/Button";
import Icon from "../../../shared/ui/Icon/Icon";
import TableAddWordForm from "./add-word/TableAddWordForm";
import ImportModal from "./import/TableImportModal";
import SaveModal from "./save-changes/TableSaveModal";

// -- Types & Utils --
import { importWords } from "../../../entities/word/api/words";
import { WordWithId } from "../../../entities/word/model/types";
import { isDesktopMode } from "../../../shared/config/appMode";
import { buildImportPreviewFiles, ImportPreviewFile } from "../lib/tableImport";
import { buildWordChanges } from "../lib/tableEditChanges";
import { exportWordsToXlsx } from "../lib/tableExport";

interface TableActionsProps {
  isEditing: boolean;
  hasChanges: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onEdit: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onRefresh: () => void;
  onWordAdded: (newWord: WordWithId) => void;
  onLocalChange: () => void;
  existingWords: WordWithId[];
  wordsToExport: WordWithId[];
  editedWords: WordWithId[];
  modifiedFields: Set<string>;
}

export default function TableActions({
  isEditing,
  hasChanges,
  searchInput,
  onSearchChange,
  onClearSearch,
  onEdit,
  onSave,
  onCancel,
  onRefresh,
  onWordAdded,
  onLocalChange,
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // === DERIVED STATE ===
  const changes = useMemo(
    () =>
      buildWordChanges({
        modifiedFields,
        existingWords,
        editedWords,
      }),
    [modifiedFields, existingWords, editedWords],
  );

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

      await exportWordsToXlsx({
        path: filePath,
        words: wordsToExport,
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
    try {
      await onSave();
      setIsSaveModalOpen(false);
    } catch (error) {
      console.error("Error confirming save:", error);
    }
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

    try {
      setIsAddingImportedWords(true);

      const draftWords = importPreviewFiles.flatMap((file) => file.draftWords);
      await importWords(draftWords);

      handleCloseImportModal();
      onRefresh();
      onLocalChange();
    } catch (error) {
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
              <IconButton
                type="button"
                className="has-tooltip tooltip-left"
                icon="add"
                label="Add"
                onClick={() => setIsAddModalOpen(true)}
                data-tooltip="Add"
              />
              {isDesktopMode && (
                <>
                  <IconButton
                    type="button"
                    className="has-tooltip tooltip-center"
                    icon="import"
                    label="Import"
                    onClick={handleOpenImportModal}
                    data-tooltip="Import"
                  />
                  <IconButton
                    type="button"
                    className="has-tooltip tooltip-center"
                    icon="export"
                    label="Export"
                    onClick={handleExportClick}
                    data-tooltip="Export"
                  />
                </>
              )}
            </div>
          ) : null}
        </div>

        <div className="table-actions-center">
          <div className="table-search">
            <span className="table-search-icon" aria-hidden="true">
              <Icon name="search" />
            </span>
            <input
              className="table-search-input"
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              spellCheck={false}
            />
            {searchInput && (
              <IconButton
                className="table-search-clear"
                icon="close"
                label="Clear search"
                onClick={onClearSearch}
                type="button"
                size="sm"
              />
            )}
          </div>
        </div>

        <div className="table-actions-side table-actions-right">
          {!isEditing ? (
            <div className="edit-group">
              <IconButton
                type="button"
                className="has-tooltip tooltip-right"
                icon="edit"
                label="Edit"
                onClick={onEdit}
                data-tooltip="Edit (Ctrl+E)"
              />
            </div>
          ) : (
            <div className="edit-group">
              {hasChanges && (
                <Button
                  type="button"
                  className="save-btn has-tooltip tooltip-center"
                  onClick={() => setIsSaveModalOpen(true)}
                  data-tooltip="Save"
                  aria-label="Save"
                >
                  <span className="material-symbols-outlined">check</span>
                </Button>
              )}
              <IconButton
                type="button"
                className="has-tooltip tooltip-right"
                icon="close"
                label="Cancel"
                onClick={onCancel}
                data-tooltip="Cancel"
              />
            </div>
          )}
        </div>
      </div>

      <TableAddWordForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWordAdded={onWordAdded}
        onLocalChange={onLocalChange}
      />

      {isDesktopMode && (
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
      )}

      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSave}
        changes={changes}
      />
    </>
  );
}
