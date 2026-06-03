// -- React --
import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

// -- Components --
import HomePage from "../features/home/page/HomePage";
import ReviewPage from "../features/review/page/ReviewPage";
import { VocabularyPage } from "../features/vocabulary";
import PracticePage from "../features/practice/page/PracticePage";
import { AccountModal, useAuthSession, WebLoginPage } from "../features/account";
import AppLayout from "./AppLayout";
import { ToastProvider } from "../shared/ui/Toast/ToastProvider";

// -- Types & Utils --
import { saveReturnPath } from "../entities/auth/api/auth";
import { useGlobalWords } from "./hooks/useGlobalWords";
import { useVocabularySync } from "./hooks/useVocabularySync";
import { isDesktopMode } from "../shared/config/appMode";
import { ROUTES } from "../shared/lib/routes";

// -- Style --
import "./App.css";

type AppTheme = "dark" | "light";
const THEME_STORAGE_KEY = "engvocab-theme";

const getInitialTheme = (): AppTheme => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "dark" ? "dark" : "light";
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const startupSyncAccessTokenRef = useRef<string | null>(null);
  const {
    accessToken,
    user,
    sessionStatus,
    isCheckingAuth,
    isBootstrapping,
    isLoggedIn,
    login,
    register,
    logout,
  } = useAuthSession();
  const shouldLoadWords = isDesktopMode;
  const {
    globalWords,
    isLoading,
    loadError,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordDeleted,
  } = useGlobalWords({ enabled: shouldLoadWords });
  const handleSynced = useCallback(async () => {
    await fetchGlobalWords();
  }, [fetchGlobalWords]);
  const {
    isSyncing,
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

  const handleLoginClick = useCallback(() => {
    if (location.pathname !== ROUTES.login) {
      saveReturnPath(location.pathname);
    }

    navigate(ROUTES.login);
  }, [location.pathname, navigate]);

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

  const shouldRenderAccountModal = isDesktopMode;

  const layoutElement = (
    <AppLayout
      theme={theme}
      user={user}
      sessionStatus={sessionStatus}
      isBootstrapping={isBootstrapping}
      isLoggedIn={isLoggedIn}
      loadError={loadError}
      isSyncing={isSyncing}
      showSyncAction={isDesktopMode}
      syncStatus={syncStatus}
      pendingChangeCount={pendingChangeCount}
      lastSyncedAt={lastSyncedAt}
      onThemeToggle={handleThemeToggle}
      onLoginClick={handleLoginClick}
      onLogout={logout}
      onSyncNow={syncNow}
      onRetryLoad={() => void fetchGlobalWords()}
    />
  );

  return (
    <ToastProvider>
      <main className="container">
        <Routes>
          {isDesktopMode ? (
            <Route
              path={ROUTES.login}
              element={<Navigate to={ROUTES.home} replace />}
            />
          ) : null}

          <Route element={layoutElement}>
            <Route path="/" element={<Navigate to={ROUTES.home} replace />} />

            {!isDesktopMode ? (
              <Route
                path={ROUTES.login}
                element={
                  isLoggedIn ? (
                    <Navigate to={ROUTES.home} replace />
                  ) : (
                    <WebLoginPage
                      isAuthenticated={isLoggedIn}
                      isCheckingAuth={isCheckingAuth}
                      onLogin={login}
                      onRegister={register}
                    />
                  )
                }
              />
            ) : null}

            <Route
              path={ROUTES.home}
              element={<HomePage words={globalWords} />}
            />
            <Route
              path={ROUTES.review}
              element={
                <ReviewPage
                  words={globalWords}
                  onReviewUpdate={handleReviewUpdate}
                  onLocalChange={scheduleSync}
                />
              }
            />
            <Route path={ROUTES.practice} element={<PracticePage />} />
            <Route
              path={ROUTES.vocabulary}
              element={
                <VocabularyPage
                  words={globalWords}
                  onRefresh={fetchGlobalWords}
                  onWordDeleted={handleWordDeleted}
                  onWordAdded={handleWordAdded}
                  onLocalChange={scheduleSync}
                />
              }
            />
          </Route>
        </Routes>

        {shouldRenderAccountModal ? (
          <AccountModal
            isOpen={isAccountModalOpen}
            user={user}
            isCheckingAuth={isCheckingAuth}
            showSyncAction={isDesktopMode}
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            pendingChangeCount={pendingChangeCount}
            lastSyncedAt={lastSyncedAt}
            onClose={() => setIsAccountModalOpen(false)}
            onLogin={login}
            onRegister={register}
            onLogout={logout}
            onSyncNow={syncNow}
          />
        ) : null}
      </main>
    </ToastProvider>
  );
}

export default App;
