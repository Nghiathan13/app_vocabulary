import AddWordForm from "../../add-word/components/AddWordForm";
import { WordWithId } from "../../../entities/word/model/types";

import "./Table_Import.css";

interface TableAddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWordAdded: (newWord: WordWithId) => void;
  onWordAudioReady: (wordId: number) => void;
}

export default function TableAddWordModal({
  isOpen,
  onClose,
  onWordAdded,
  onWordAudioReady,
}: TableAddWordModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="import-modal-overlay">
      <div className="import-modal add-word-modal">
        <div className="import-modal-header">
          <div />
          <button
            type="button"
            className="import-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="action-icon action-icon-close" />
          </button>
        </div>

        <div className="import-modal-body">
          <AddWordForm
            onWordAdded={onWordAdded}
            onWordAudioReady={onWordAudioReady}
            onAdded={onClose}
          />
        </div>
      </div>
    </div>
  );
}
