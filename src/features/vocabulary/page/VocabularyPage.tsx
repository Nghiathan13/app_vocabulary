// -- Components --
import Table from "../components/Table/Table";

// -- Types & Utils --
import { WordWithId } from "../../../entities/word/model/types";

// -- Style --
import "./VocabularyPage.css";

interface VocabularyPageProps {
  words: WordWithId[];
  onRefresh: () => void;
  onWordDeleted: (wordId: number) => void;
  onWordAdded: (newWord: WordWithId) => void;
  onWordAudioReady: (wordId: number) => void;
}

export default function VocabularyPage({
  words,
  onRefresh,
  onWordDeleted,
  onWordAdded,
  onWordAudioReady,
}: VocabularyPageProps) {
  return (
    <div className="vocabulary-container">
      <Table
        words={words}
        onRefresh={onRefresh}
        onWordDeleted={onWordDeleted}
        onWordAdded={onWordAdded}
        onWordAudioReady={onWordAudioReady}
      />
    </div>
  );
}
