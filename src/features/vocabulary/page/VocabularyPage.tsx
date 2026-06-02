// -- Components --
import Table from "../../vocabulary/components/Table";

// -- Types & Utils --
import { WordId, WordWithId } from "../../../entities/word/model/types";

// -- Style --
import "./VocabularyPage.css";

interface VocabularyPageProps {
  words: WordWithId[];
  onRefresh: () => void;
  onWordDeleted: (wordId: WordId) => void;
  onWordAdded: (newWord: WordWithId) => void;
  onWordAudioReady: (wordId: WordId) => void;
  onLocalChange: () => void;
}

export default function VocabularyPage({
  words,
  onRefresh,
  onWordDeleted,
  onWordAdded,
  onWordAudioReady,
  onLocalChange,
}: VocabularyPageProps) {
  return (
    <div className="vocabulary-container">
      <Table
        words={words}
        onRefresh={onRefresh}
        onWordDeleted={onWordDeleted}
        onWordAdded={onWordAdded}
        onWordAudioReady={onWordAudioReady}
        onLocalChange={onLocalChange}
      />
    </div>
  );
}
