// -- React --
import { useEffect, useRef } from "react";

// -- Types & Utils --
import { WordWithId } from "../../../entities/word/model/types";
import { useReviewAudio } from "../hooks/useReviewAudio";
import { useTypingField } from "../hooks/useTypingField";
import { useReviewSession } from "../hooks/useReviewSession";
import ReviewFlashcard from "../components/ReviewFlashcard";
import ReviewHint from "../components/ReviewHint";
import ReviewModeToggle from "../components/ReviewModeToggle";
import ReviewProgress from "../components/ReviewProgress";
import ReviewTypingCard from "../components/ReviewTypingCard";

// -- Style --
import "./ReviewPage.css";

interface ReviewPageProps {
  words: WordWithId[];
  onReviewUpdate?: (word: string, updates: Partial<WordWithId>) => void;
  onLocalChange?: () => void;
}

export default function ReviewPage({
  words,
  onReviewUpdate,
  onLocalChange,
}: ReviewPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    reviewWords,
    currentIndex,
    currentWord,
    reviewTotal,
    showMeaning,
    setShowMeaning,
    reviewMode,
    typedAnswer,
    setTypedAnswer,
    typingResult,
    isTypingMode,
    canGradeCurrentWord,
    handleReviewModeChange,
    handleTypingSubmit,
    handleReviewGrade,
  } = useReviewSession({
    words,
    onReviewUpdate,
    onLocalChange,
  });

  const {
    hasAudio,
    handlePronounce,
  } = useReviewAudio({
    currentWord,
  });

  const {
    typingInputRef,
    typingMeasureRef,
    typingFieldText,
    typingFieldStyle,
  } = useTypingField({
    typedAnswer,
    isTypingMode,
  });

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!currentWord) return;

    const isInputTarget =
      e.target instanceof HTMLElement &&
      (e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable);

    if (isTypingMode) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTypingSubmit();
        return;
      }

      if (canGradeCurrentWord && (e.key === "1" || e.key === "4")) {
        e.preventDefault();
        await handleReviewGrade(e.key === "1");
        return;
      }

      if (!isInputTarget && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (hasAudio) {
          handlePronounce();
        }
      }

      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      setShowMeaning((prev) => !prev);
      return;
    }

    if (e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (hasAudio) {
        handlePronounce();
      }
      return;
    }

    if (canGradeCurrentWord && (e.key === "1" || e.key === "4")) {
      await handleReviewGrade(e.key === "1");
    }
  };

  useEffect(() => {
    if (isTypingMode && !typingResult) {
      typingInputRef.current?.focus();
      return;
    }

    wrapperRef.current?.focus();
  }, [currentIndex, showMeaning, isTypingMode, typingResult, typingInputRef]);

  if (reviewWords.length === 0) {
    return (
      <div className="no-review">
        <h2>No words to review today</h2>
      </div>
    );
  }

  return (
    <div
      className={`review-wrapper review-mode-${reviewMode}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={wrapperRef}
    >
      <ReviewModeToggle
        mode={reviewMode}
        onModeChange={handleReviewModeChange}
      />

      <ReviewProgress currentIndex={currentIndex} total={reviewTotal} />

      <div
        className={`review-card-stage ${
          isTypingMode ? "is-typing" : "is-flashcard"
        }`}
      >
        {isTypingMode ? (
          <ReviewTypingCard
            word={currentWord!}
            typedAnswer={typedAnswer}
            typingResult={typingResult}
            typingFieldText={typingFieldText}
            typingFieldStyle={typingFieldStyle}
            typingInputRef={typingInputRef}
            typingMeasureRef={typingMeasureRef}
            hasAudio={hasAudio}
            onTypedAnswerChange={setTypedAnswer}
            onPronounce={() => handlePronounce()}
          />
        ) : (
          <ReviewFlashcard
            word={currentWord!}
            showMeaning={showMeaning}
            hasAudio={hasAudio}
            onPronounce={() => handlePronounce()}
          />
        )}
      </div>

      <ReviewHint
        mode={reviewMode}
        showMeaning={showMeaning}
        typingResult={typingResult}
      />
    </div>
  );
}
