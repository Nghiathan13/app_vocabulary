import { create } from "zustand";
import { WordWithId } from "./types";
import { listWords } from "../api/words";

interface WordState {
  globalWords: WordWithId[];
  isLoading: boolean;
  loadError: boolean;
  setWords: (words: WordWithId[]) => void;
  setLoading: (isLoading: boolean) => void;
  fetchGlobalWords: () => Promise<void>;
  handleWordAdded: (newWord: WordWithId) => void;
  handleWordDeleted: (wordId: number) => void;
  handleWordAudioReady: (wordId: number) => void;
  handleReviewUpdate: (wordStr: string, updates: Partial<WordWithId>) => void;
}

export const useWordStore = create<WordState>((set) => ({
  globalWords: [],
  isLoading: true,
  loadError: false,

  setWords: (words) => set({ globalWords: words }),
  setLoading: (isLoading) => set({ isLoading }),

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

  handleWordAudioReady: (wordId) =>
    set((state) => ({
      globalWords: state.globalWords.map((w) =>
        w.id === wordId && !w.hasAudio ? { ...w, hasAudio: true } : w,
      ),
    })),

  handleReviewUpdate: (wordStr, updates) =>
    set((state) => ({
      globalWords: state.globalWords.map((w) =>
        w.word === wordStr ? { ...w, ...updates } : w,
      ),
    })),
}));
