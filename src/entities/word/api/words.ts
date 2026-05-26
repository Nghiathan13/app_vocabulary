import { invoke } from "@tauri-apps/api/core";

import { WordImportDraft, WordWithId } from "../model/types";

interface InsertWordParams {
  word: string;
  ipa: string;
  type: string;
  meaning: string;
}

export async function insertWord({
  word,
  ipa,
  type,
  meaning,
}: InsertWordParams): Promise<WordWithId> {
  return await invoke<WordWithId>("insert_new_word", {
    word,
    ipa,
    type,
    meaning,
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
  reps: number;
  lastReview: string;
  nextReview: string | null;
}

export async function updateWordReview({
  word,
  reps,
  lastReview,
  nextReview,
}: UpdateWordReviewParams): Promise<void> {
  await invoke<void>("update_word_review_rust", {
    word,
    reps,
    lastReview,
    nextReview,
  });
}

export async function updateWordFields(word: WordWithId): Promise<void> {
  await invoke<void>("update_word_fields_rust", { word });
}

export async function deleteWordById(id: number): Promise<void> {
  await invoke<void>("delete_word_by_id_rust", { id });
}

export async function importWords(draftWords: WordImportDraft[]): Promise<void> {
  await invoke<void>("import_words_rust", { draftWords });
}
