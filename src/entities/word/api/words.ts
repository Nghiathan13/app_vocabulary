import { invoke } from "@tauri-apps/api/core";

import { WordImportDraft, WordWithId } from "../model/types";

interface InsertWordParams {
  word: string;
  ipa: string;
  type: string;
  meaning_vi: string;
}

function toTauriWord(word: WordWithId) {
  return {
    id: word.id,
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

export async function deleteWordById(id: number): Promise<void> {
  await invoke<void>("delete_word_by_id_rust", { id });
}

export async function importWords(draftWords: WordImportDraft[]): Promise<void> {
  await invoke<void>("import_words_rust", {
    draftWords: draftWords.map(toTauriImportDraft),
  });
}
