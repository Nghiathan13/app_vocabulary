export type WordType = string;
export type WordId = number | string;

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
  id: WordId;
  hasAudio?: boolean;
  sync_id?: string | null;
  sync_status?: "pending_create" | "pending_update" | "pending_delete" | "synced" | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  last_synced_at?: string | null;
}

export type WordImportDraft = Pick<
  Word,
  "word" | "ipa" | "type" | "meaning_vi"
>;
