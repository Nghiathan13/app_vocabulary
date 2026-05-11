// -- React --
import { useState, useEffect, useCallback } from "react";

// -- Tauri --
import Database from "@tauri-apps/plugin-sql";
import { readDir } from "@tauri-apps/plugin-fs";
import { appConfigDir, join } from "@tauri-apps/api/path";

// -- Components --
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Home/Home";
import Review from "./components/Review/Review";
import Insights from "./components/Insights/Insights";
import Practice from "./components/Practice/Practice";
import { ToastProvider } from "./components/Toast/ToastProvider";

// -- Types & Utils --
import { Tab, WordWithId } from "./types";
import { getAudioFileName } from "./utils";

// -- Style --
import "./App.css";

function App() {
  // === STATE ===
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [globalWords, setGlobalWords] = useState<WordWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // === EFFECTS ===
  useEffect(() => {
    fetchGlobalWords();
  }, [fetchGlobalWords]);

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
              <Home
                onWordAdded={handleWordAdded}
                onWordAudioReady={handleWordAudioReady}
              />
            )}
            {currentTab === "review" && (
              <Review onReviewUpdate={handleReviewUpdate} />
            )}
            {currentTab === "practice" && <Practice />}
            {currentTab === "insights" && (
              <Insights
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
