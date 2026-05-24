// -- React --
import { useState, useEffect, useCallback, useRef } from "react";

// -- Tauri --
import Database from "@tauri-apps/plugin-sql";
import { readDir } from "@tauri-apps/plugin-fs";
import { appConfigDir, join } from "@tauri-apps/api/path";

// -- Components --
import Navbar from "../shared/ui/Navbar/Navbar";
import AddWordPage from "../features/add-word/page/AddWordPage";
import ReviewPage from "../features/review/page/ReviewPage";
import VocabularyPage from "../features/vocabulary/page/VocabularyPage";
import PracticePage from "../features/practice/page/PracticePage";
import { ToastProvider } from "../shared/ui/Toast/ToastProvider";

// -- Types & Utils --
import { Tab } from "../shared/model/tab";
import { WordWithId } from "../entities/word/model/types";
import { getAudioFileName } from "../shared/lib/utils";
import { downloadAudioStatus, getElevenLabsQuota } from "../shared/api/audio";

// -- Style --
import "./App.css";

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

function App() {
  // === STATE ===
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [globalWords, setGlobalWords] = useState<WordWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const audioSyncStartedRef = useRef(false);

  const fetchGlobalWords = useCallback(async () => {
    try {
      const db = await Database.load("sqlite:vocabulary.db");
      const result = await db.select<WordWithId[]>(
        "SELECT rowid as id, * FROM words ORDER BY word ASC",
      );

      let audioFiles = new Set<string>();
      try {
        const configDir = await appConfigDir();
        const audioDir = await join(configDir, "audio");
        const entries = await readDir(audioDir);
        audioFiles = new Set(entries.map((e) => e.name.toLowerCase()));
      } catch (error) {
        console.warn("Không thể quét thư mục audio:", error);
      }

      const wordsWithAudio = result.map((w) => {
        const fileName = getAudioFileName(w.word);
        return {
          ...w,
          hasAudio: audioFiles.has(fileName.toLowerCase()),
        };
      });

      setGlobalWords(wordsWithAudio);
    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === HANDLERS ===
  const handleReviewUpdate = useCallback(
    (wordStr: string, updates: Partial<WordWithId>) => {
      setGlobalWords((prev) =>
        prev.map((w) => (w.word === wordStr ? { ...w, ...updates } : w)),
      );
    },
    [],
  );

  const handleWordAdded = useCallback((newWord: WordWithId) => {
    setGlobalWords((prev) =>
      [...prev, newWord].sort((a, b) => a.word.localeCompare(b.word)),
    );
  }, []);

  const handleWordAudioReady = useCallback((wordId: number) => {
    setGlobalWords((prev) =>
      prev.map((w) =>
        w.id === wordId && !w.hasAudio ? { ...w, hasAudio: true } : w,
      ),
    );
  }, []);

  const handleWordDeleted = useCallback((wordId: number) => {
    setGlobalWords((prev) => prev.filter((w) => w.id !== wordId));
  }, []);

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

  // === EFFECTS ===
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

  return (
    <ToastProvider>
      <main className="container">
        <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

        {isLoading ? (
          <div className="global-loading">
            <div className="spinner"></div>
            <p>Loading your vocabulary...</p>
          </div>
        ) : (
          <>
            {currentTab === "home" && (
              <AddWordPage
                onWordAdded={handleWordAdded}
                onWordAudioReady={handleWordAudioReady}
              />
            )}
            {currentTab === "review" && (
              <ReviewPage onReviewUpdate={handleReviewUpdate} />
            )}
            {currentTab === "practice" && <PracticePage />}
            {currentTab === "insights" && (
              <VocabularyPage
                words={globalWords}
                onRefresh={fetchGlobalWords}
                onWordDeleted={handleWordDeleted}
              />
            )}
          </>
        )}
      </main>
    </ToastProvider>
  );
}

export default App;
