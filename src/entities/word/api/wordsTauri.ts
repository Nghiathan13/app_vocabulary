import { invoke } from "@tauri-apps/api/core";

import { WordId, WordImportDraft, WordWithId } from "../model/types";

interface InsertWordParams {
  word: string;
  ipa: string;
  type: string;
  meaning_vi: string;
}

function toTauriWord(word: WordWithId) {
  return {
    id: Number(word.id),
    word: word.word,
    ipa: word.ipa,
    type: word.type,
    meaning_vi: word.meaning_vi,
    definition: word.definition,
    example: word.example,
    band: word.band,
    level: word.level,
    wrong_count: word.wrong_count,
    last_review: word.last_review,
    next_review: word.next_review,
    sync_id: word.sync_id,
    sync_status: word.sync_status,
    updated_at: word.updated_at,
    deleted_at: word.deleted_at,
    last_synced_at: word.last_synced_at,
    hasAudio: word.hasAudio,
  };
}

function toTauriImportDraft(draft: WordImportDraft) {
  return {
    word: draft.word,
    ipa: draft.ipa,
    type: draft.type,
    meaningVi: draft.meaning_vi,
  };
}

export async function insertWord({
  word,
  ipa,
  type,
  meaning_vi,
}: InsertWordParams): Promise<WordWithId> {
  return await invoke<WordWithId>("insert_new_word", {
    word,
    ipa,
    type,
    meaningVi: meaning_vi,
  });
}

export async function listWords(): Promise<WordWithId[]> {
  return await invoke<WordWithId[]>("get_all_words");
}

export async function listDueReviewWords(): Promise<WordWithId[]> {
  return await invoke<WordWithId[]>("get_due_review_words");
}

export interface UpdateWordReviewParams {
  word: string;
  level: number;
  wrongCount: number;
  lastReview: string;
  nextReview: string | null;
}

export async function updateWordReview({
  word,
  level,
  wrongCount,
  lastReview,
  nextReview,
}: UpdateWordReviewParams): Promise<void> {
  await invoke<void>("update_word_review_rust", {
    word,
    level,
    wrongCount,
    lastReview,
    nextReview,
  });
}

export async function updateWordFields(word: WordWithId): Promise<void> {
  await invoke<void>("update_word_fields_rust", { word: toTauriWord(word) });
}

export async function deleteWordById(id: WordId): Promise<void> {
  await invoke<void>("delete_word_by_id_rust", { id: Number(id) });
}

export async function importWords(draftWords: WordImportDraft[]): Promise<void> {
  await invoke<void>("import_words_rust", {
    draftWords: draftWords.map(toTauriImportDraft),
  });
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
}

export interface SyncMergeId {
  local_id: string;
  server_id: string;
}

export async function getWordSyncChanges(): Promise<WordWithId[]> {
  return await invoke<WordWithId[]>("get_word_sync_changes");
}

export async function applyWordSyncResult({
  words,
  deletedSyncIds,
  mergedIds,
  syncedAt,
}: {
  words: RemoteSyncWord[];
  deletedSyncIds: string[];
  mergedIds: SyncMergeId[];
  syncedAt: string;
}): Promise<void> {
  await invoke<void>("apply_word_sync_result", {
    words,
    deletedSyncIds,
    mergedIds,
    syncedAt,
  });
}
