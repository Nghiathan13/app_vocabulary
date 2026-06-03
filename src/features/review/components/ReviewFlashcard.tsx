import type { WordWithId } from "../../../entities/word/model/types";
import WordTypePills from "../../../entities/word/ui/WordTypePills";

interface ReviewFlashcardProps {
  word: WordWithId;
  showMeaning: boolean;
  hasAudio: boolean;
  onPronounce: () => void;
}

export default function ReviewFlashcard({
  word,
  showMeaning,
  hasAudio,
  onPronounce,
}: ReviewFlashcardProps) {
  return (
    <div className="review-card">
      <div className="review-word">
        <div className="word-header">
          <h2>{word.word}</h2>
          <WordTypePills type={word.type} variant="review" />
        </div>
        {word.ipa && (
          <p className="review-ipa">
            <button
              className={`pronounce-btn has-tooltip tooltip-center ${!hasAudio ? "disabled" : ""}`}
              onClick={hasAudio ? onPronounce : undefined}
              type="button"
              data-tooltip={
                hasAudio ? "Pronunciation (A)" : "Không có file âm thanh"
              }
            >
              <span className="material-symbols-outlined">volume_up</span>
            </button>
            <span>/{word.ipa}/</span>
          </p>
        )}
      </div>

      <div className={`review-meaning ${showMeaning ? "show" : ""}`}>
        {word.meaning_vi || "Không có nghĩa"}
      </div>
    </div>
  );
}
