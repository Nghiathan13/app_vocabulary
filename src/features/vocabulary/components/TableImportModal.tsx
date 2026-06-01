import { Button, IconButton } from "../../../shared/ui/Button/Button";
import Modal from "../../../shared/ui/Modal/Modal";

// -- Types & Utils --
import { ImportPreviewFile } from "../lib/tableImport";

interface ImportModalProps {
  isOpen: boolean;
  files: ImportPreviewFile[];
  isScanning: boolean;
  isAdding: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onClose: () => void;
  onPickFiles: () => void;
  onRemoveFile: (path: string) => void;
}

export default function ImportModal({
  isOpen,
  files,
  isScanning,
  isAdding,
  canAdd,
  onAdd,
  onClose,
  onPickFiles,
  onRemoveFile,
}: ImportModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      closeButtonDisabled={isAdding}
      headerStart={
        <IconButton
          type="button"
          className="import-modal-action"
          icon="import"
          label="Import files"
          onClick={onPickFiles}
          disabled={isAdding}
          size="sm"
        />
      }
      footer={
        <Button
          type="button"
          className="import-add-btn"
          variant="primary"
          fullWidth
          onClick={onAdd}
          disabled={!canAdd || isAdding}
        >
          {isAdding ? "Adding..." : "Add"}
        </Button>
      }
    >
      {!isScanning && !isAdding && files.length === 0 ? (
        <p className="import-empty">No files selected.</p>
      ) : null}

      {files.map((file) => (
        <div
          key={file.path}
          className={`import-file-card ${file.isValid ? "valid" : "invalid"}`}
        >
          <div className="import-file-top">
            <IconButton
              type="button"
              className="import-file-remove-btn"
              icon="close"
              label="Remove file"
              onClick={() => onRemoveFile(file.path)}
              disabled={isAdding}
              size="sm"
            />

            <div className="import-file-content">
              <span className="import-file-name">{file.name}</span>

              {file.isValid ? (
                <p className="import-file-detail">
                  {file.newWordCount} new words ready.
                </p>
              ) : (
                file.errors.map((error) => (
                  <p key={`${file.path}-${error}`} className="import-file-error">
                    {error}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      ))}

      {isScanning ? <p className="import-scanning">Scanning files...</p> : null}

      {isAdding ? <p className="import-scanning">Adding words...</p> : null}
    </Modal>
  );
}
