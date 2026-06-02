import { useEffect } from "react";

import { useWordStore } from "../../entities/word/model/store";
import { WordId, WordWithId } from "../../entities/word/model/types";

export interface UseGlobalWordsResult {
  globalWords: WordWithId[];
  isLoading: boolean;
  loadError: boolean;
  fetchGlobalWords: () => Promise<void>;
  handleReviewUpdate: (
    wordStr: string,
    updates: Partial<WordWithId>,
  ) => void;
  handleWordAdded: (newWord: WordWithId) => void;
  handleWordAudioReady: (wordId: WordId) => void;
  handleWordDeleted: (wordId: WordId) => void;
}

export function useGlobalWords({
  enabled = true,
}: {
  enabled?: boolean;
} = {}): UseGlobalWordsResult {
  const {
    globalWords,
    isLoading,
    loadError,
    setWords,
    setLoading,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordAudioReady,
    handleWordDeleted,
  } = useWordStore();

  useEffect(() => {
    if (!enabled) {
      setWords([]);
      setLoading(false);
      return;
    }

    fetchGlobalWords();
  }, [enabled, fetchGlobalWords, setLoading, setWords]);

  return {
    globalWords,
    isLoading,
    loadError,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordAudioReady,
    handleWordDeleted,
  };
}
