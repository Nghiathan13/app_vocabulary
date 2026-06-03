import type { CSSProperties } from "react";

export type ReviewMode = "flashcard" | "typing";

export type TypingFieldStyle = CSSProperties & {
  "--typing-field-width": string;
};

export interface TypingResult {
  isCorrect: boolean;
  submittedAnswer: string;
}
