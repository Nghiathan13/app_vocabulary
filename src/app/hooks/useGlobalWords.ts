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
  handleWordDeleted: (wordId: WordId) => void;
}

export function useGlobalWords({
  enabled = true,
}: {
  enabled?: boolean;
} = {}): UseGlobalWordsResult {
  const {
    globalWords,
    loadError,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordDeleted,
  } = useWordStore();

  const isLoading = useWordStore((state) => (enabled ? state.isLoading : false));

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetchGlobalWords();
  }, [enabled, fetchGlobalWords]);

  return {
    globalWords,
    isLoading,
    loadError,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordDeleted,
  };
}
