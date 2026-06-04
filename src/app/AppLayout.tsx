import { Outlet, useLocation } from "react-router-dom";

import WebGuestGate from "../features/account/components/WebGuestGate";
import type { WebSessionStatus } from "../features/account/hooks/useAuthSession";
import Navbar from "../shared/ui/Navbar/Navbar";
import { isWebMode } from "../shared/config/appMode";
import type { AuthUser } from "../entities/auth/api/auth";
import { ROUTES } from "../shared/lib/routes";
import type { VocabularySyncStatus } from "../shared/lib/syncStatus";
import refreshIcon from "../assets/refresh_icon.svg";
import AppRouteSkeleton from "./AppRouteSkeleton";

type AppTheme = "dark" | "light";

interface AppLayoutProps {
  theme: AppTheme;
  user: AuthUser | null;
  sessionStatus: WebSessionStatus;
  isBootstrapping: boolean;
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
  authError?: string | null;
  onDismissAuthError?: () => void;
}

export default function AppLayout({
  theme,
  user,
  sessionStatus,
  isBootstrapping,
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
  authError,
  onDismissAuthError,
}: AppLayoutProps) {
  const location = useLocation();
  const isLoginRoute = location.pathname === ROUTES.login;

  const renderMain = () => {
    if (isWebMode && isBootstrapping) {
      return <AppRouteSkeleton />;
    }

    if (isWebMode && sessionStatus === "guest" && !isLoginRoute) {
      return (
        <WebGuestGate
          authError={authError}
          onDismissAuthError={onDismissAuthError}
        />
      );
    }

    if (sessionStatus === "memberLoading") {
      return <AppRouteSkeleton />;
    }

    if (loadError) {
      return (
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
      );
    }

    if (isLoading) {
      return <AppRouteSkeleton />;
    }

    return <Outlet />;
  };

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

      {renderMain()}
    </>
  );
}
