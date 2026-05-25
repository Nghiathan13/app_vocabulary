// -- React --
import { useState } from "react";

// -- Components --
import Navbar from "../shared/ui/Navbar/Navbar";
import HomePage from "../features/home/page/HomePage";
import ReviewPage from "../features/review/page/ReviewPage";
import VocabularyPage from "../features/vocabulary/page/VocabularyPage";
import PracticePage from "../features/practice/page/PracticePage";
import { ToastProvider } from "../shared/ui/Toast/ToastProvider";

// -- Types & Utils --
import { Tab } from "../shared/model/tab";
import { useGlobalWords } from "./hooks/useGlobalWords";

// -- Style --
import "./App.css";

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const {
    globalWords,
    isLoading,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordAudioReady,
    handleWordDeleted,
  } = useGlobalWords();

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
            {currentTab === "home" && <HomePage words={globalWords} />}
            {currentTab === "review" && (
              <ReviewPage onReviewUpdate={handleReviewUpdate} />
            )}
            {currentTab === "practice" && <PracticePage />}
            {currentTab === "insights" && (
              <VocabularyPage
                words={globalWords}
                onRefresh={fetchGlobalWords}
                onWordDeleted={handleWordDeleted}
                onWordAdded={handleWordAdded}
                onWordAudioReady={handleWordAudioReady}
              />
            )}
          </>
        )}
      </main>
    </ToastProvider>
  );
}

export default App;
