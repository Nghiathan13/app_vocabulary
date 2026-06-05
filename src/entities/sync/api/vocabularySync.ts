import {
  RemoteSyncWord,
  SyncMergeId,
} from "../../word/api/words";
import { WordWithId } from "../../word/model/types";
import { API_BASE_URL } from "../../../shared/config/appMode";
import {
  ApiUnauthorizedError,
  notifyUnauthorized,
} from "../../auth/api/auth";

interface ServerSyncWord {
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

export interface VocabularySyncResponse {
  words: RemoteSyncWord[];
  deletedSyncIds: string[];
  mergedIds: SyncMergeId[];
  syncedAt: string;
}

const toServerChange = (word: WordWithId) => ({
  id: word.sync_id,
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
  updated_at: word.updated_at,
  deleted_at: word.deleted_at,
});

const toRemoteSyncWord = (word: ServerSyncWord): RemoteSyncWord => ({
  sync_id: word.id,
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
  created_at: word.created_at,
  updated_at: word.updated_at,
  deleted_at: word.deleted_at,
  audio_status: word.audio_status,
  audio_url: word.audio_url,
  hasAudio: word.hasAudio,
});

export async function syncVocabulary(
  token: string,
  changes: WordWithId[],
): Promise<VocabularySyncResponse> {
  const response = await fetch(`${API_BASE_URL}/vocab/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ changes: changes.map(toServerChange) }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized();
      throw new ApiUnauthorizedError();
    }

    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Sync failed");
  }

  const body = (await response.json()) as {
    words: ServerSyncWord[];
    deletedIds: string[];
    mergedIds: Array<{ localId: string; serverId: string }>;
    syncedAt: string;
  };

  return {
    words: body.words.map(toRemoteSyncWord),
    deletedSyncIds: body.deletedIds,
    mergedIds: body.mergedIds.map((merge) => ({
      local_id: merge.localId,
      server_id: merge.serverId,
    })),
    syncedAt: body.syncedAt,
  };
}
