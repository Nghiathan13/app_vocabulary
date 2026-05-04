import "./Table_SaveModal.css";

export interface WordChange {
  word: string;
  field: string;
  oldValue: string;
  newValue: string;
}

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  changes: WordChange[];
}

export default function SaveModal({
  isOpen,
  onClose,
  onSave,
  changes,
}: SaveModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="import-modal-overlay">
      <div className="import-modal save-modal">
        <div className="import-modal-header">
          <div /> {/* Spacer */}
          <button className="import-icon-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="import-modal-body">
          <div className="save-changes-table-wrapper">
            <div className="save-changes-header">
              <div className="save-col-word">Word</div>
              <div className="save-col-old">Old</div>
              <div className="save-col-new">New</div>
            </div>

            <div className="save-changes-body">
              {changes.length === 0 ? (
                <p className="import-empty">No changes detected.</p>
              ) : (
                changes.map((change, idx) => (
                  <div
                    key={`${change.word}-${change.field}-${idx}`}
                    className="save-changes-row"
                  >
                    <div className="save-col-word">{change.word}</div>
                    <div className="save-col-old">{change.oldValue || "-"}</div>
                    <div className="save-col-new">{change.newValue || "-"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="import-modal-footer">
          <button
            className="save-confirm-btn"
            onClick={onSave}
            disabled={changes.length === 0}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
