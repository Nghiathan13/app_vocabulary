// -- Types & Utils --
import { ImportPreviewFile } from "./_tableImport";

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
  // === RENDER ===
  if (!isOpen) {
    return null;
  }

  return (
    <div className="import-modal-overlay">
      <div className="import-modal">
        <div className="import-modal-header">
          <button
            className="import-modal-action"
            onClick={onPickFiles}
            disabled={isAdding}
          >
            <span className="material-symbols-outlined">upload</span>
          </button>

          <button
            className="import-icon-btn"
            onClick={onClose}
            disabled={isAdding}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="import-modal-body">
          {!isScanning && !isAdding && files.length === 0 ? (
            <p className="import-empty">No files selected.</p>
          ) : null}

          {files.map((file) => (
            <div
              key={file.path}
              className={`import-file-card ${file.isValid ? "valid" : "invalid"}`}
            >
              <div className="import-file-top">
                <button
                  className="import-icon-btn import-file-remove-btn"
                  onClick={() => onRemoveFile(file.path)}
                  disabled={isAdding}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>

                <div className="import-file-content">
                  <span className="import-file-name">{file.name}</span>

                  {file.isValid ? (
                    <p className="import-file-detail">
                      {file.newWordCount} new words ready.
                    </p>
                  ) : (
                    file.errors.map((error) => (
                      <p
                        key={`${file.path}-${error}`}
                        className="import-file-error"
                      >
                        {error}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}

          {isScanning ? (
            <p className="import-scanning">Scanning files...</p>
          ) : null}

          {isAdding ? <p className="import-scanning">Adding words...</p> : null}
        </div>

        <div className="import-modal-footer">
          <button
            className="import-add-btn"
            onClick={onAdd}
            disabled={!canAdd || isAdding}
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
