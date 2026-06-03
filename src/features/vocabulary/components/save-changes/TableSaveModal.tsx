import { useState } from "react";
import { Button } from "../../../../shared/ui/Button/Button";
import Modal from "../../../../shared/ui/Modal/Modal";
import type { WordChange } from "../../lib/tableEditChanges";

// -- Style --
import "./TableSaveModal.css";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  changes: WordChange[];
}

export default function SaveModal({
  isOpen,
  onClose,
  onSave,
  changes,
}: SaveModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = async () => {
    if (isSaving || changes.length === 0) return;
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error("Error saving changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? undefined : onClose}
      className="save-modal"
      showCloseButton={!isSaving}
      footer={
        <Button
          type="button"
          className="save-confirm-btn"
          variant="outline"
          fullWidth
          onClick={handleSaveClick}
          disabled={changes.length === 0 || isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      }
    >
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
    </Modal>
  );
}
