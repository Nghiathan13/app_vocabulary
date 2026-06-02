import { API_BASE_URL } from "../../../shared/config/appMode";
import { WordId, WordImportDraft, WordWithId } from "../model/types";
import type { InsertWordParams, UpdateWordReviewParams } from "./words";

const AUTH_TOKEN_KEY = "engvocab-access-token";

interface ServerWord {
  id: string;
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

const getAccessToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Login required");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Request failed");
  }

  return await response.json();
}

const toWordWithId = (word: ServerWord): WordWithId => ({
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
  sync_id: word.id,
  sync_status: "synced",
  updated_at: word.updated_at ?? null,
  deleted_at: word.deleted_at ?? null,
  last_synced_at: word.updated_at ?? null,
  audio_status: word.audio_status ?? null,
  audio_url: word.audio_url ?? null,
  hasAudio: Boolean(word.hasAudio),
});

const toServerWord = (word: WordWithId) => ({
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
});

export async function insertWord({
  word,
  ipa,
  type,
  meaning_vi,
}: InsertWordParams): Promise<WordWithId> {
  const createdWord = await request<ServerWord>("/vocab", {
    method: "POST",
    body: JSON.stringify({
      word,
      ipa,
      type,
      meaning_vi,
      level: 0,
      wrong_count: 0,
      last_review: null,
      next_review: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    }),
  });

  return toWordWithId(createdWord);
}

export async function listWords(): Promise<WordWithId[]> {
  const words = await request<ServerWord[]>("/vocab");

  return words.map(toWordWithId);
}

export async function listDueReviewWords(): Promise<WordWithId[]> {
  const today = new Date().toISOString().slice(0, 10);
  const words = await listWords();

  return words
    .filter((word) => word.next_review && word.next_review <= today)
    .sort((a, b) => (a.next_review ?? "").localeCompare(b.next_review ?? ""));
}

export async function updateWordFields(word: WordWithId): Promise<void> {
  await request<ServerWord>(`/vocab/${word.id}`, {
    method: "PATCH",
    body: JSON.stringify(toServerWord(word)),
  });
}

export async function deleteWordById(id: WordId): Promise<void> {
  await request<ServerWord>(`/vocab/${id}`, {
    method: "DELETE",
  });
}

export async function importWords(_draftWords: WordImportDraft[]): Promise<void> {
  throw new Error("Import is only available in desktop mode");
}

export async function updateWordReview({
  word,
  level,
  wrongCount,
  lastReview,
  nextReview,
}: UpdateWordReviewParams): Promise<void> {
  const words = await listWords();
  const currentWord = words.find((item) => item.word === word);

  if (!currentWord) {
    throw new Error("Word not found");
  }

  await updateWordFields({
    ...currentWord,
    level,
    wrong_count: wrongCount,
    last_review: lastReview,
    next_review: nextReview,
  });
}
