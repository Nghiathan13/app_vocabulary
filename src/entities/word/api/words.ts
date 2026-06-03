import { isWebMode } from "../../../shared/config/appMode";
import { WordId, WordImportDraft, WordWithId } from "../model/types";
import * as tauriWords from "./wordsTauri";
import * as webWords from "./wordsWeb";

export interface InsertWordParams {
  word: string;
  ipa: string;
  type: string;
  meaning_vi: string;
}

export interface UpdateWordReviewParams {
  word: string;
  level: number;
  wrongCount: number;
  lastReview: string;
  nextReview: string | null;
}

export interface RemoteSyncWord {
  sync_id: string;
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
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  audio_status?: string | null;
  audio_url?: string | null;
  hasAudio?: boolean;
}

export interface SyncMergeId {
  local_id: string;
  server_id: string;
}

const adapter = isWebMode ? webWords : tauriWords;

export const insertWord: (
  params: InsertWordParams,
) => Promise<WordWithId> = adapter.insertWord;
export const listWords: () => Promise<WordWithId[]> = adapter.listWords;
export const updateWordReview: (
  params: UpdateWordReviewParams,
) => Promise<void> = adapter.updateWordReview;
export const updateWordFields: (word: WordWithId) => Promise<void> =
  adapter.updateWordFields;
export const deleteWordById: (id: WordId) => Promise<void> =
  adapter.deleteWordById;
export const importWords: (draftWords: WordImportDraft[]) => Promise<void> =
  adapter.importWords;

export const getWordSyncChanges = tauriWords.getWordSyncChanges;
export const applyWordSyncResult = tauriWords.applyWordSyncResult;
