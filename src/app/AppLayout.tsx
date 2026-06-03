import { Navigate, Outlet } from "react-router-dom";

import Navbar from "../shared/ui/Navbar/Navbar";
import { isWebMode } from "../shared/config/appMode";
import type { AuthUser } from "../entities/auth/api/auth";
import { ROUTES } from "../shared/lib/routes";
import type { VocabularySyncStatus } from "../shared/lib/syncStatus";
import refreshIcon from "../assets/refresh_icon.svg";

type AppTheme = "dark" | "light";

interface AppLayoutProps {
  theme: AppTheme;
  user: AuthUser | null;
  isCheckingAuth: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  loadError: boolean;
  isSyncing: boolean;
  showSyncAction: boolean;
  syncStatus: VocabularySyncStatus;
  pendingChangeCount: number;
  lastSyncedAt: string | null;
  onThemeToggle: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
  onSyncNow: () => Promise<void>;
  onRetryLoad: () => void;
}

export default function AppLayout({
  theme,
  user,
  isCheckingAuth,
  isLoggedIn,
  isLoading,
  loadError,
  isSyncing,
  showSyncAction,
  syncStatus,
  pendingChangeCount,
  lastSyncedAt,
  onThemeToggle,
  onLoginClick,
  onLogout,
  onSyncNow,
  onRetryLoad,
}: AppLayoutProps) {
  if (isWebMode && !isCheckingAuth && !user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return (
    <>
      <Navbar
        theme={theme}
        isLoggedIn={isLoggedIn}
        userName={user?.name ?? null}
        userEmail={user?.email ?? null}
        isSyncing={isSyncing}
        showSyncAction={showSyncAction}
        syncStatus={syncStatus}
        pendingChangeCount={pendingChangeCount}
        lastSyncedAt={lastSyncedAt}
        onThemeToggle={onThemeToggle}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        onSyncNow={onSyncNow}
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
            onClick={onRetryLoad}
            aria-label="Retry loading vocabulary"
          >
            <img src={refreshIcon} alt="" width={48} height={48} />
          </button>
          <p className="global-load-error-message">
            Failed to load vocabulary. Please try again.
          </p>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
}
