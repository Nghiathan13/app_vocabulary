export type WordType = string;

export type Word = {
  word: string;
  ipa: string | null;
  type: string | null;
  meaning_vi: string;
  definition: string | null;
  example: string | null;
  band: string | null;
  level: number;
  wrong_count: number;
  last_review: string | null;
  next_review: string | null;
};

export interface WordWithId extends Word {
  id: number;
  hasAudio?: boolean;
}

export type WordImportDraft = Pick<
  Word,
  "word" | "ipa" | "type" | "meaning_vi"
>;
