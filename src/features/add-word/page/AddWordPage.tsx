import { WordWithId } from "../../../entities/word/model/types";
import AddWordForm from "../components/AddWordForm";

import "./AddWordPage.css";

interface AddWordPageProps {
  onWordAdded?: (newWord: WordWithId) => void;
  onWordAudioReady?: (wordId: number) => void;
}

export default function AddWordPage({
  onWordAdded,
  onWordAudioReady,
}: AddWordPageProps) {
  return (
    <div className="form-wrapper">
      <div className="form-header">
        <h1>English Vocabulary</h1>
      </div>

      <AddWordForm
        onWordAdded={onWordAdded}
        onWordAudioReady={onWordAudioReady}
      />
    </div>
  );
}
