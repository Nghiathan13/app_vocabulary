import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import "./App.css";
import { Tab, WordWithId } from "./types";
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Home/Home";
import Review from "./components/Review/Review";
import Insights from "./components/Insights/Insights";
import Practice from "./components/Practice/Practice";

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [globalWords, setGlobalWords] = useState<WordWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGlobalWords = useCallback(async () => {
    try {
      const db = await Database.load("sqlite:vocabulary.db");
      const result = await db.select<WordWithId[]>(
        "SELECT rowid as id, * FROM words ORDER BY word ASC",
      );
      setGlobalWords(result);
    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReviewUpdate = useCallback(
    (wordStr: string, updates: Partial<WordWithId>) => {
      setGlobalWords((prev) =>
        prev.map((w) => (w.word === wordStr ? { ...w, ...updates } : w)),
      );
    },
    [],
  );

  useEffect(() => {
    fetchGlobalWords();
  }, [fetchGlobalWords]);

  return (
    <main className="container">
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

      {isLoading ? (
        <div className="global-loading">
          <div className="spinner"></div>
          <p>Loading your vocabulary...</p>
        </div>
      ) : (
        <>
          {currentTab === "home" && <Home onWordAdded={fetchGlobalWords} />}
          {currentTab === "review" && (
            <Review onReviewUpdate={handleReviewUpdate} />
          )}
          {currentTab === "practice" && <Practice />}
          {currentTab === "insights" && (
            <Insights words={globalWords} onRefresh={fetchGlobalWords} />
          )}
        </>
      )}
    </main>
  );
}

export default App;
