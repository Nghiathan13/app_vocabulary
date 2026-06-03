import { WordWithId } from "../../../entities/word/model/types";
import { WRONG_COUNT_THRESHOLD } from "../../../entities/word/lib/wordStats";

interface HomeWrongCountListProps {
  highWrongCountWords: WordWithId[];
}

export default function HomeWrongCountList({
  highWrongCountWords,
}: HomeWrongCountListProps) {
  return (
    <article className="home-card home-wrong-card">
      <div className="home-card-heading">
        <div>
          <span className="home-card-label">Wrong count</span>
        </div>
      </div>

      {highWrongCountWords.length > 0 ? (
        <div className="home-wrong-list">
          {highWrongCountWords.map((word) => (
            <div className="home-wrong-row" key={word.id}>
              <span>{word.word}</span>
              <strong>{word.wrong_count}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="home-wrong-empty">
          No words with {WRONG_COUNT_THRESHOLD}+ mistakes.
        </p>
      )}
    </article>
  );
}
