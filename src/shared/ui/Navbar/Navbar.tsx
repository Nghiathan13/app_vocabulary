import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

// -- Types & Utils --
import type { VocabularySyncStatus } from "../../lib/syncStatus";
import { ROUTES } from "../../lib/routes";
import SyncStatusDisplay from "../SyncStatusDisplay/SyncStatusDisplay";

// -- Style --
import "./Navbar.css";

type AppTheme = "dark" | "light";

interface NavbarProps {
  theme: AppTheme;
  isLoggedIn: boolean;
  userName: string | null;
  userEmail: string | null;
  isSyncing: boolean;
  showSyncAction: boolean;
  syncStatus: VocabularySyncStatus;
  pendingChangeCount: number;
  lastSyncedAt: string | null;
  onThemeToggle: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
  onSyncNow: () => Promise<void>;
}

const navIconLinkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-icon-btn${isActive ? " active" : ""}`;

export default function Navbar({
  theme,
  isLoggedIn,
  userName,
  userEmail,
  isSyncing,
  showSyncAction,
  syncStatus,
  pendingChangeCount,
  lastSyncedAt,
  onThemeToggle,
  onLoginClick,
  onLogout,
  onSyncNow,
}: NavbarProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isAccountMenuOpen]);

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    onLogout();
  };

  const handleSyncNow = () => {
    void onSyncNow().catch((error) => {
      console.warn("Manual sync failed:", error);
    });
  };

  return (
    <nav className="navbar">
      {/* === LEFT === */}
      <div className="navbar-left">
        <NavLink
          className="nav-logo-btn"
          to={ROUTES.home}
          aria-label="EngVocab Home"
          title="Home"
        >
          <span className="nav-home-icon" aria-hidden="true" />
        </NavLink>
      </div>

      {/* === CENTER === */}
      <div className="navbar-center">
        <NavLink
          className={navIconLinkClass}
          to={ROUTES.review}
          aria-label="Review"
          title="Review"
        >
          {({ isActive }) => (
            <span className="nav-icon-stack" aria-hidden="true">
              <span
                className={`review-off-icon nav-page-icon ${isActive ? "" : "is-visible"}`}
              />
              <span
                className={`review-on-icon nav-page-icon ${isActive ? "is-visible" : ""}`}
              />
            </span>
          )}
        </NavLink>

        <NavLink
          className={navIconLinkClass}
          to={ROUTES.practice}
          aria-label="Practice"
          title="Practice"
        >
          {({ isActive }) => (
            <span className="nav-icon-stack" aria-hidden="true">
              <span
                className={`practice-off-icon nav-page-icon ${isActive ? "" : "is-visible"}`}
              />
              <span
                className={`practice-on-icon nav-page-icon ${isActive ? "is-visible" : ""}`}
              />
            </span>
          )}
        </NavLink>

        <NavLink
          className={navIconLinkClass}
          to={ROUTES.vocabulary}
          aria-label="Vocabulary"
          title="Vocabulary"
        >
          {({ isActive }) => (
            <span className="nav-icon-stack" aria-hidden="true">
              <span
                className={`vocabulary-off-icon nav-page-icon ${isActive ? "" : "is-visible"}`}
              />
              <span
                className={`vocabulary-on-icon nav-page-icon ${isActive ? "is-visible" : ""}`}
              />
            </span>
          )}
        </NavLink>
      </div>

      {/* === RIGHT === */}
      <div className="navbar-right">
        {!isLoggedIn ? (
          <button
            className="nav-login-btn"
            type="button"
            onClick={onLoginClick}
          >
            Log in
          </button>
        ) : null}

        <button
          className="nav-theme-btn"
          type="button"
          onClick={onThemeToggle}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          <span
            className={theme === "dark" ? "light-mode-icon" : "dark-mode-icon"}
            aria-hidden="true"
          />
        </button>

        {isLoggedIn ? (
          <div className="nav-account-menu" ref={accountMenuRef}>
            <button
              className="nav-account-btn"
              type="button"
              onClick={() => setIsAccountMenuOpen((current) => !current)}
              aria-label="Account"
              title="Account"
              aria-expanded={isAccountMenuOpen}
            >
              <span className="account-default-icon" aria-hidden="true" />
            </button>

            {isAccountMenuOpen ? (
              <div className="nav-account-dropdown">
                <div className="nav-account-header">
                  <span className="account-default-icon nav-account-header-icon" aria-hidden="true" />
                  <div className="nav-account-info">
                    <p className="nav-account-name">{userName || "Learner"}</p>
                    {userEmail ? (
                      <p className="nav-account-email">{userEmail}</p>
                    ) : null}
                  </div>
                </div>

                <div className="nav-account-divider" />

                {showSyncAction ? (
                  <>
                    <SyncStatusDisplay
                      isSyncing={isSyncing}
                      syncStatus={syncStatus}
                      pendingChangeCount={pendingChangeCount}
                      lastSyncedAt={lastSyncedAt}
                      labelClassName="nav-sync-status"
                      detailClassName="nav-sync-detail"
                      offlineClassName="nav-sync-status--offline"
                      labelAs="div"
                    />

                    <button
                      type="button"
                      className="nav-account-dropdown-item"
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                    >
                      <span className="sync-icon" aria-hidden="true" />
                      {isSyncing ? "Syncing..." : "Sync now"}
                    </button>

                    <div className="nav-account-divider" />
                  </>
                ) : null}

                <button
                  type="button"
                  className="nav-account-dropdown-item"
                  onClick={handleLogout}
                >
                  <span className="logout-icon" aria-hidden="true" />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
