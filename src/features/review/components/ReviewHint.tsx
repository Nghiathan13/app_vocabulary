import type { ReviewMode, TypingResult } from "../model/reviewTypes";

interface ReviewHintProps {
  mode: ReviewMode;
  showMeaning: boolean;
  typingResult: TypingResult | null;
}

export default function ReviewHint({
  mode,
  showMeaning,
  typingResult,
}: ReviewHintProps) {
  return (
    <div className="review-hint">
      {mode === "typing" ? (
        <p>{typingResult ? "1 • 4" : "enter"}</p>
      ) : !showMeaning ? (
        <p>space</p>
      ) : (
        <p>1 • 4</p>
      )}
    </div>
  );
}
