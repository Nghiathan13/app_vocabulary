export type Tab = "home" | "review" | "practice" | "insights";
export type WordType = string;
export type Word = {
  word: string;
  ipa: string | null;
  type: string | null;
  meaning: string | null;
  reps: number;
  last_review: string | null;
  next_review: string | null;
};

export interface WordWithId extends Word {
  id: number;
  hasAudio?: boolean;
}
