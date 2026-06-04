import { useState, useEffect, useRef } from "react";
import { WordWithId } from "../../../entities/word/model/types";
import { getDueReviewWords } from "../../../entities/word/lib/wordStats";
import { getLocalDateString } from "../../../shared/lib/utils";
import { updateWordReview } from "../../../entities/word/api/words";
import { getSpacedRepetitionUpdate } from "../lib/spacedRepetition";
import { compareTypingAnswer } from "../lib/typing";
import type { ReviewMode, TypingResult } from "../model/reviewTypes";

const REVIEW_MODE_STORAGE_KEY = "reviewMode";

const getInitialReviewMode = (): ReviewMode => {
  return localStorage.getItem(REVIEW_MODE_STORAGE_KEY) === "typing"
    ? "typing"
    : "flashcard";
};

interface UseReviewSessionProps {
  words: WordWithId[];
  onReviewUpdate?: (word: string, updates: Partial<WordWithId>) => void;
  onLocalChange?: () => void;
}

export function useReviewSession({
  words,
  onReviewUpdate,
  onLocalChange,
}: UseReviewSessionProps) {
  const [reviewWords, setReviewWords] = useState<WordWithId[]>(() =>
    getDueReviewWords(words, getLocalDateString()),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewMode, setReviewMode] =
    useState<ReviewMode>(getInitialReviewMode);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [typingResult, setTypingResult] = useState<TypingResult | null>(null);
  /** Keep progress after grade (`onReviewUpdate`); reset on later `words` refresh (e.g. desktop sync). */
  const preserveProgressOnNextWordsChangeRef = useRef(false);

  const currentWord = reviewWords[0] as WordWithId | undefined;
  const isTypingMode = reviewMode === "typing";
  const canGradeCurrentWord = isTypingMode
    ? Boolean(typingResult)
    : showMeaning;
  const reviewTotal = currentIndex + reviewWords.length;

  const handleReviewModeChange = (mode: ReviewMode) => {
    setReviewMode(mode);
    localStorage.setItem(REVIEW_MODE_STORAGE_KEY, mode);
    setShowMeaning(false);
    setTypedAnswer("");
    setTypingResult(null);
  };

  const handleTypingSubmit = () => {
    if (!currentWord || typingResult) {
      return;
    }

    const submittedAnswer = typedAnswer.trim();
    setTypingResult({
      isCorrect: compareTypingAnswer(currentWord.word, submittedAnswer),
      submittedAnswer,
    });
  };

  const handleReviewGrade = async (isForgot: boolean) => {
    if (!currentWord) {
      return;
    }

    const { nextLevel: newLevel, nextWrongCount, daysToAdd } =
      getSpacedRepetitionUpdate(
        currentWord.level,
        currentWord.wrong_count,
        isForgot,
      );

    try {
      const newNextReview =
        daysToAdd > 0 ? getLocalDateString(daysToAdd) : null;
      const newLastReview = getLocalDateString(0);

      await updateWordReview({
        source: currentWord,
        level: newLevel,
        wrongCount: nextWrongCount,
        lastReview: newLastReview,
        nextReview: newNextReview,
      });

      setReviewWords((currentQueue) =>
        currentQueue.filter((word) => word.id !== currentWord.id),
      );
      setCurrentIndex((completedCount) => completedCount + 1);
      setShowMeaning(false);
      setTypedAnswer("");
      setTypingResult(null);
      preserveProgressOnNextWordsChangeRef.current = true;

      if (onReviewUpdate) {
        onReviewUpdate(currentWord.word, {
          level: newLevel,
          wrong_count: nextWrongCount,
          last_review: newLastReview,
          next_review: newNextReview,
        });
      }

      onLocalChange?.();
    } catch (error) {
      console.error("Lỗi update review:", error);
    }
  };

  useEffect(() => {
    setReviewWords(getDueReviewWords(words, getLocalDateString()));

    if (preserveProgressOnNextWordsChangeRef.current) {
      preserveProgressOnNextWordsChangeRef.current = false;
    } else {
      setCurrentIndex(0);
    }
  }, [words]);

  useEffect(() => {
    setShowMeaning(false);
    setTypedAnswer("");
    setTypingResult(null);
  }, [currentWord?.id, reviewMode]);

  return {
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
  };
}
