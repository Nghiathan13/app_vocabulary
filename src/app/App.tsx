// -- React --
import { useCallback } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// -- Components --
import HomePage from "../features/home/page/HomePage";
import ReviewPage from "../features/review/page/ReviewPage";
import { VocabularyPage } from "../features/vocabulary";
import PracticePage from "../features/practice/page/PracticePage";
import { AccountModal, WebLoginPage } from "../features/account";
import AppLayout from "./AppLayout";
import { ToastProvider } from "../shared/ui/Toast/ToastProvider";

// -- Types & Utils --
import type { VocabularySyncControls } from "./lib/vocabularySyncIdle";
import { IDLE_VOCABULARY_SYNC } from "./lib/vocabularySyncIdle";
import { useAppShell, type AppShellState } from "./hooks/useAppShell";
import { useDesktopStartupSync } from "./hooks/useDesktopStartupSync";
import { useDesktopVocabularySync } from "./hooks/useDesktopVocabularySync";
import { isDesktopMode } from "../shared/config/appMode";
import { ROUTES } from "../shared/lib/routes";

// -- Style --
import "./App.css";

function AppRoutes({
  shell,
  sync,
  showSyncAction,
}: {
  shell: AppShellState;
  sync: VocabularySyncControls;
  showSyncAction: boolean;
}) {
  const {
    theme,
    isAccountModalOpen,
    setIsAccountModalOpen,
    user,
    sessionStatus,
    isBootstrapping,
    isLoggedIn,
    isCheckingAuth,
    login,
    register,
    logout,
    globalWords,
    loadError,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordDeleted,
    handleThemeToggle,
    handleLoginClick,
    authError,
    clearAuthError,
  } = shell;

  const {
    isSyncing,
    lastSyncedAt,
    pendingChangeCount,
    syncStatus,
    scheduleSync,
    syncNow,
  } = sync;

  const layoutElement = (
    <AppLayout
      theme={theme}
      user={user}
      sessionStatus={sessionStatus}
      isBootstrapping={isBootstrapping}
      isLoggedIn={isLoggedIn}
      loadError={loadError}
      isSyncing={isSyncing}
      showSyncAction={showSyncAction}
      syncStatus={syncStatus}
      pendingChangeCount={pendingChangeCount}
      lastSyncedAt={lastSyncedAt}
      onThemeToggle={handleThemeToggle}
      onLoginClick={handleLoginClick}
      onLogout={logout}
      onSyncNow={syncNow}
      onRetryLoad={() => void fetchGlobalWords()}
      authError={authError}
      onDismissAuthError={clearAuthError}
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
                      authError={authError}
                      onDismissAuthError={clearAuthError}
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

        {showSyncAction ? (
          <AccountModal
            isOpen={isAccountModalOpen}
            user={user}
            isCheckingAuth={isCheckingAuth}
            showSyncAction
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            pendingChangeCount={pendingChangeCount}
            lastSyncedAt={lastSyncedAt}
            onClose={() => setIsAccountModalOpen(false)}
            onLogin={login}
            onRegister={register}
            onLogout={logout}
            onSyncNow={syncNow}
            authError={authError}
            onDismissAuthError={clearAuthError}
          />
        ) : null}
      </main>
    </ToastProvider>
  );
}

function AppWeb() {
  const shell = useAppShell({ loadWords: false });

  return (
    <AppRoutes shell={shell} sync={IDLE_VOCABULARY_SYNC} showSyncAction={false} />
  );
}

function AppDesktop() {
  const shell = useAppShell({ loadWords: true });
  const onSynced = useCallback(async () => {
    await shell.fetchGlobalWords();
  }, [shell.fetchGlobalWords]);

  const sync = useDesktopVocabularySync({
    accessToken: shell.accessToken,
    onSynced,
  });

  useDesktopStartupSync({
    accessToken: shell.accessToken,
    user: shell.user,
    isLoading: shell.isLoading,
    isCheckingAuth: shell.isCheckingAuth,
    syncNow: sync.syncNow,
  });

  return <AppRoutes shell={shell} sync={sync} showSyncAction />;
}

export default function App() {
  return isDesktopMode ? <AppDesktop /> : <AppWeb />;
}
