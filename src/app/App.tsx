// -- React --
import { useEffect, useState } from "react";

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
import refreshIcon from "../assets/refresh_icon.svg";

// -- Style --
import "./App.css";

type AppTheme = "dark" | "light";
const THEME_STORAGE_KEY = "engvocab-theme";

const getInitialTheme = (): AppTheme => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "light" ? "light" : "dark";
};

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const {
    globalWords,
    isLoading,
    loadError,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordAudioReady,
    handleWordDeleted,
  } = useGlobalWords();

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ToastProvider>
      <main className="container">
        <Navbar
          currentTab={currentTab}
          theme={theme}
          onTabChange={setCurrentTab}
          onThemeToggle={handleThemeToggle}
        />

        {isLoading ? (
          <div className="global-loading">
            <div className="spinner"></div>
            <p>Loading your vocabulary...</p>
          </div>
        ) : loadError ? (
          <div className="global-load-error">
            <button
              type="button"
              className="global-load-error-retry"
              onClick={() => void fetchGlobalWords()}
              aria-label="Retry loading vocabulary"
            >
              <img src={refreshIcon} alt="" width={48} height={48} />
            </button>
            <p className="global-load-error-message">
              Failed to load vocabulary. Please try again.
            </p>
          </div>
        ) : (
          <>
            {currentTab === "home" && (
              <HomePage words={globalWords} onNavigate={setCurrentTab} />
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
