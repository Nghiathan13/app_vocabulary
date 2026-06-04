import { create } from "zustand";
import { WordId, WordWithId } from "./types";
import { listWords } from "../api/words";

interface WordState {
  globalWords: WordWithId[];
  isLoading: boolean;
  loadError: boolean;
  fetchGlobalWords: () => Promise<void>;
  clearGlobalWords: () => void;
  handleWordAdded: (newWord: WordWithId) => void;
  handleWordDeleted: (wordId: WordId) => void;
  handleReviewUpdate: (wordStr: string, updates: Partial<WordWithId>) => void;
}

export const useWordStore = create<WordState>((set) => ({
  globalWords: [],
  isLoading: false,
  loadError: false,

  fetchGlobalWords: async () => {
    set({ isLoading: true, loadError: false });
    try {
      const words = await listWords();
      set({ globalWords: words, loadError: false });
    } catch {
      set({ loadError: true });
    } finally {
      set({ isLoading: false });
    }
  },

  clearGlobalWords: () =>
    set({
      globalWords: [],
      isLoading: false,
      loadError: false,
    }),

  handleWordAdded: (newWord) =>
    set((state) => ({
      globalWords: [...state.globalWords, newWord].sort((a, b) =>
        a.word.localeCompare(b.word),
      ),
    })),

  handleWordDeleted: (wordId) =>
    set((state) => ({
      globalWords: state.globalWords.filter((w) => w.id !== wordId),
    })),

  handleReviewUpdate: (wordStr, updates) =>
    set((state) => ({
      globalWords: state.globalWords.map((w) =>
        w.word === wordStr ? { ...w, ...updates } : w,
      ),
    })),
}));
