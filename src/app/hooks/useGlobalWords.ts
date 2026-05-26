import { useEffect, useCallback, useRef } from "react";

import { useWordStore } from "../../entities/word/model/store";
import { WordWithId } from "../../entities/word/model/types";
import { downloadAudioStatus, getElevenLabsQuota } from "../../shared/api/audio";

const AUDIO_SYNC_RETRY_AFTER_KEY = "elevenlabsAudioSyncRetryAfter";
const FALLBACK_RESET_DAY = 19;

const getStoredAudioSyncRetryAfter = () => {
  const value = localStorage.getItem(AUDIO_SYNC_RETRY_AFTER_KEY);
  return value ? Number(value) : null;
};

const setAudioSyncRetryAfter = (retryAfter: number) => {
  localStorage.setItem(AUDIO_SYNC_RETRY_AFTER_KEY, String(retryAfter));
};

const clearAudioSyncRetryAfter = () => {
  localStorage.removeItem(AUDIO_SYNC_RETRY_AFTER_KEY);
};

const getFallbackResetTime = () => {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(0, 0, 0, 0);
  reset.setDate(FALLBACK_RESET_DAY);

  if (reset.getTime() <= now.getTime()) {
    reset.setMonth(reset.getMonth() + 1);
  }

  return reset.getTime();
};

export interface UseGlobalWordsResult {
  globalWords: WordWithId[];
  isLoading: boolean;
  fetchGlobalWords: () => Promise<void>;
  handleReviewUpdate: (
    wordStr: string,
    updates: Partial<WordWithId>,
  ) => void;
  handleWordAdded: (newWord: WordWithId) => void;
  handleWordAudioReady: (wordId: number) => void;
  handleWordDeleted: (wordId: number) => void;
}

export function useGlobalWords(): UseGlobalWordsResult {
  const {
    globalWords,
    isLoading,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordAudioReady,
    handleWordDeleted,
  } = useWordStore();

  const audioSyncStartedRef = useRef(false);

  const syncMissingAudio = useCallback(
    async (words: WordWithId[]) => {
      const missingWords = words.filter((word) => !word.hasAudio);
      if (missingWords.length === 0) {
        return;
      }

      const retryAfter = getStoredAudioSyncRetryAfter();
      if (retryAfter && retryAfter > Date.now()) {
        return;
      }

      let quotaResetTime: number | null = null;

      try {
        const quota = await getElevenLabsQuota();
        quotaResetTime = quota.nextCharacterCountResetUnix
          ? quota.nextCharacterCountResetUnix * 1000
          : null;

        if (
          quota.characterLimit > 0 &&
          quota.characterCount >= quota.characterLimit
        ) {
          setAudioSyncRetryAfter(quotaResetTime ?? getFallbackResetTime());
          return;
        }

        clearAudioSyncRetryAfter();
      } catch (error) {
        console.warn("Không thể đọc quota ElevenLabs:", error);
      }

      for (const word of missingWords) {
        const result = await downloadAudioStatus(word.word);

        if (result.status === "ready") {
          handleWordAudioReady(word.id);
          continue;
        }

        if (result.status === "quota_exhausted") {
          setAudioSyncRetryAfter(quotaResetTime ?? getFallbackResetTime());
          console.warn("ElevenLabs quota exhausted:", result.message);
          break;
        }

        console.warn(`Không thể tải audio cho "${word.word}":`, result.message);
      }
    },
    [handleWordAudioReady],
  );

  useEffect(() => {
    fetchGlobalWords();
  }, [fetchGlobalWords]);

  useEffect(() => {
    if (isLoading || audioSyncStartedRef.current) {
      return;
    }

    audioSyncStartedRef.current = true;
    void syncMissingAudio(globalWords);
  }, [globalWords, isLoading, syncMissingAudio]);

  return {
    globalWords,
    isLoading,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordAudioReady,
    handleWordDeleted,
  };
}
