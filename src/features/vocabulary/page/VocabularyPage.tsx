// -- Components --
import Table from "../components/Table";

// -- Types & Utils --
import { WordId, WordWithId } from "../../../entities/word/model/types";

// -- Style --
import "./VocabularyPage.css";

interface VocabularyPageProps {
  words: WordWithId[];
  onRefresh: () => void;
  onWordDeleted: (wordId: WordId) => void;
  onWordAdded: (newWord: WordWithId) => void;
  onLocalChange: () => void;
}

export default function VocabularyPage({
  words,
  onRefresh,
  onWordDeleted,
  onWordAdded,
  onLocalChange,
}: VocabularyPageProps) {
  return (
    <div className="vocabulary-container">
      <Table
        words={words}
        onRefresh={onRefresh}
        onWordDeleted={onWordDeleted}
        onWordAdded={onWordAdded}
        onLocalChange={onLocalChange}
      />
    </div>
  );
}
