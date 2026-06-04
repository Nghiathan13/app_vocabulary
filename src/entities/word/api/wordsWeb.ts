import {
  ApiUnauthorizedError,
  notifyUnauthorized,
} from "../../auth/api/auth";
import { AUTH_ACCESS_TOKEN_KEY } from "../../auth/lib/sessionStorage";
import { API_BASE_URL } from "../../../shared/config/appMode";
import { WordId, WordImportDraft, WordWithId } from "../model/types";
import type { InsertWordParams } from "./words";
import type { UpdateWordReviewParams } from "./wordReviewParams";

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

const getAccessToken = () => localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

type WordsWebRequestOptions = RequestInit & {
  /** When set, used instead of localStorage (bootstrap / explicit token). */
  accessToken?: string | null;
};

async function request<T>(
  path: string,
  { accessToken: accessTokenOverride, ...fetchOptions }: WordsWebRequestOptions = {},
): Promise<T> {
  const token = accessTokenOverride ?? getAccessToken();

  if (!token) {
    throw new Error("Login required");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...fetchOptions.headers,
      },
    });
  } catch {
    throw new Error("Cannot connect to server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized();
      throw new ApiUnauthorizedError();
    }

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

export async function listWords(accessToken?: string): Promise<WordWithId[]> {
  const words = await request<ServerWord[]>("/vocab", { accessToken });

  return words.map(toWordWithId);
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
  source,
  level,
  wrongCount,
  lastReview,
  nextReview,
}: UpdateWordReviewParams): Promise<void> {
  await updateWordFields({
    ...source,
    level,
    wrong_count: wrongCount,
    last_review: lastReview,
    next_review: nextReview,
  });
}
