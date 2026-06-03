import type { ReviewMode } from "../model/reviewTypes";

interface ReviewModeToggleProps {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
}

export default function ReviewModeToggle({
  mode,
  onModeChange,
}: ReviewModeToggleProps) {
  return (
    <div className="review-mode-toggle" role="tablist">
      <button
        className={`review-mode-btn ${mode === "flashcard" ? "active" : ""}`}
        onClick={() => onModeChange("flashcard")}
        type="button"
      >
        <span className="material-symbols-outlined">style</span>
        Flashcard
      </button>
      <button
        className={`review-mode-btn ${mode === "typing" ? "active" : ""}`}
        onClick={() => onModeChange("typing")}
        type="button"
      >
        <span className="material-symbols-outlined">keyboard</span>
        Keyboard
      </button>
    </div>
  );
}
