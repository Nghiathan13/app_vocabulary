import type { RefObject } from "react";

import type { WordWithId } from "../../../entities/word/model/types";
import WordTypePills from "../../../entities/word/ui/WordTypePills";
import { getTypingAnswer } from "../lib/typing";
import type { TypingFieldStyle, TypingResult } from "../model/reviewTypes";

interface ReviewTypingCardProps {
  word: WordWithId;
  typedAnswer: string;
  typingResult: TypingResult | null;
  typingFieldText: string;
  typingFieldStyle: TypingFieldStyle;
  typingInputRef: RefObject<HTMLInputElement | null>;
  typingMeasureRef: RefObject<HTMLSpanElement | null>;
  hasAudio: boolean;
  onTypedAnswerChange: (value: string) => void;
  onPronounce: () => void;
}

export default function ReviewTypingCard({
  word,
  typedAnswer,
  typingResult,
  typingFieldText,
  typingFieldStyle,
  typingInputRef,
  typingMeasureRef,
  hasAudio,
  onTypedAnswerChange,
  onPronounce,
}: ReviewTypingCardProps) {
  return (
    <div className="review-card typing-card">
      <div className="typing-panel">
        <div className="typing-audio-row">
          <button
            className={`typing-audio-btn has-tooltip tooltip-center ${!hasAudio ? "disabled" : ""}`}
            onClick={hasAudio ? onPronounce : undefined}
            type="button"
            data-tooltip={
              hasAudio ? "Pronunciation (A)" : "Không có file âm thanh"
            }
          >
            <span className="material-symbols-outlined">volume_up</span>
          </button>
          <WordTypePills type={word.type} variant="review" />
        </div>
        <div
          className={`review-typing-field ${typedAnswer ? "has-value" : ""}`}
          style={typingFieldStyle}
        >
          <span
            ref={typingMeasureRef}
            className="review-typing-measure"
            aria-hidden="true"
          >
            {typingFieldText}
          </span>
          <input
            ref={typingInputRef}
            className="review-typing-input"
            value={typedAnswer}
            onChange={(event) => onTypedAnswerChange(event.target.value)}
            placeholder="Type the word"
            autoComplete="off"
            spellCheck={false}
            readOnly={Boolean(typingResult)}
          />
        </div>

        <div className="typing-result">
          {typingResult && (
            <>
              <div
                className={`typing-result-label ${
                  typingResult.isCorrect ? "correct" : "wrong"
                }`}
              >
                {typingResult.isCorrect ? "Correct" : "Incorrect"}
              </div>
              <div className="typing-answer-line">
                <span>Answer</span>
                <strong>{getTypingAnswer(word.word)}</strong>
              </div>
              {!typingResult.isCorrect && (
                <div className="typing-answer-line typed-answer">
                  <span>You typed</span>
                  <strong>{typingResult.submittedAnswer || "-"}</strong>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
