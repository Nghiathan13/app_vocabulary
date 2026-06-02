// -- React --
import { useCallback, useEffect, useRef, useState } from "react";

// -- Components --
import Navbar from "../shared/ui/Navbar/Navbar";
import HomePage from "../features/home/page/HomePage";
import ReviewPage from "../features/review/page/ReviewPage";
import VocabularyPage from "../features/vocabulary/page/VocabularyPage";
import PracticePage from "../features/practice/page/PracticePage";
import SettingsModal from "../features/settings/SettingsModal";
import { ToastProvider } from "../shared/ui/Toast/ToastProvider";

// -- Types & Utils --
import { Tab } from "../shared/model/tab";
import { useAuthSession } from "./hooks/useAuthSession";
import { useGlobalWords } from "./hooks/useGlobalWords";
import { useVocabularySync } from "./hooks/useVocabularySync";
import { isDesktopMode, isWebMode } from "../shared/config/appMode";
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const startupSyncAccessTokenRef = useRef<string | null>(null);
  const {
    accessToken,
    user,
    isCheckingAuth,
    login,
    register,
    logout,
  } = useAuthSession();
  const shouldLoadWords = isDesktopMode || Boolean(user);
  const {
    globalWords,
    isLoading,
    loadError,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordAudioReady,
    handleWordDeleted,
  } = useGlobalWords({ enabled: shouldLoadWords });
  const handleSynced = useCallback(async () => {
    await fetchGlobalWords();
  }, [fetchGlobalWords]);
  const {
    isSyncing,
    syncError,
    lastSyncedAt,
    pendingChangeCount,
    syncStatus,
    scheduleSync,
    syncNow,
  } = useVocabularySync({
    accessToken,
    onSynced: handleSynced,
  });

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (
      startupSyncAccessTokenRef.current === accessToken ||
      isLoading ||
      isCheckingAuth ||
      !user ||
      !accessToken ||
      !isDesktopMode
    ) {
      return;
    }

    startupSyncAccessTokenRef.current = accessToken;
    void syncNow().catch((error) => {
      console.warn("Startup sync failed:", error);
    });
  }, [accessToken, isCheckingAuth, isLoading, syncNow, user]);

  const shouldShowWebAuthLoading = isWebMode && isCheckingAuth;
  const shouldShowWebAccountGate = isWebMode && !isCheckingAuth && !user;

  return (
    <ToastProvider>
      <main className="container">
        <Navbar
          currentTab={currentTab}
          theme={theme}
          isLoggedIn={Boolean(user)}
          isSyncing={isSyncing}
          showSyncAction={isDesktopMode}
          syncStatus={syncStatus}
          pendingChangeCount={pendingChangeCount}
          onTabChange={setCurrentTab}
          onThemeToggle={handleThemeToggle}
          onLoginClick={() => setIsSettingsOpen(true)}
          onLogout={logout}
          onSyncNow={syncNow}
        />

        {shouldShowWebAuthLoading ? (
          <div className="global-loading">
            <div className="spinner"></div>
            <p>Checking your account...</p>
          </div>
        ) : shouldShowWebAccountGate ? (
          <div className="web-account-gate">
            <h1>EngVocab Account</h1>
            <p>Log in or register to manage your vocabulary online.</p>
            <button
              type="button"
              className="web-account-gate-btn"
              onClick={() => setIsSettingsOpen(true)}
            >
              Log in
            </button>
          </div>
        ) : isLoading ? (
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
              <ReviewPage
                onReviewUpdate={handleReviewUpdate}
                onLocalChange={scheduleSync}
              />
            )}
            {currentTab === "practice" && <PracticePage />}
            {currentTab === "insights" && (
              <VocabularyPage
                words={globalWords}
                onRefresh={fetchGlobalWords}
                onWordDeleted={handleWordDeleted}
                onWordAdded={handleWordAdded}
                onWordAudioReady={handleWordAudioReady}
                onLocalChange={scheduleSync}
              />
            )}
          </>
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          user={user}
          isCheckingAuth={isCheckingAuth}
          isSyncing={isSyncing}
          syncError={syncError}
          lastSyncedAt={lastSyncedAt}
          onClose={() => setIsSettingsOpen(false)}
          onLogin={login}
          onRegister={register}
          onLogout={logout}
          onSyncNow={syncNow}
        />
      </main>
    </ToastProvider>
  );
}

export default App;
