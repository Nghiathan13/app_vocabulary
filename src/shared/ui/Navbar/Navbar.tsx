import { useEffect, useRef, useState } from "react";

// -- Types & Utils --
import { Tab } from "../../model/tab";
import { VocabularySyncStatus } from "../../../app/hooks/useVocabularySync";

// -- Style --
import logo from "../../../assets/logo.svg";
import "./Navbar.css";

type AppTheme = "dark" | "light";

interface NavbarProps {
  currentTab: Tab;
  theme: AppTheme;
  isLoggedIn: boolean;
  isSyncing: boolean;
  showSyncAction: boolean;
  syncStatus: VocabularySyncStatus;
  pendingChangeCount: number;
  onTabChange: (tab: Tab) => void;
  onThemeToggle: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
  onSyncNow: () => Promise<void>;
}

export default function Navbar({
  currentTab,
  theme,
  isLoggedIn,
  isSyncing,
  showSyncAction,
  syncStatus,
  pendingChangeCount,
  onTabChange,
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

  const syncStatusText = (() => {
    if (isSyncing || syncStatus === "syncing") {
      return "Syncing...";
    }

    if (syncStatus === "error") {
      return "Offline changes saved";
    }

    if (pendingChangeCount > 0 || syncStatus === "pending") {
      return "Pending changes";
    }

    return "Synced";
  })();

  // === RENDER ===
  return (
    <nav className="navbar">
      {/* === LEFT === */}
      <div className="navbar-left">
        <button className="nav-logo-btn" onClick={() => onTabChange("home")}>
          <img src={logo} alt="EngVocab Home" className="nav-logo" />
        </button>
      </div>

      {/* === CENTER === */}
      <div className="navbar-center">
        <button
          className={`nav-icon-btn ${currentTab === "review" ? "active" : ""}`}
          onClick={() => onTabChange("review")}
          aria-label="Review"
          title="Review"
        >
          <span
            className={currentTab === "review" ? "review-on-icon" : "review-off-icon"}
            aria-hidden="true"
          />
        </button>

        <button
          className={`nav-icon-btn ${currentTab === "practice" ? "active" : ""}`}
          onClick={() => onTabChange("practice")}
          aria-label="Practice"
          title="Practice"
        >
          <span className="material-symbols-outlined">exercise</span>
        </button>

        <button
          className={`nav-icon-btn ${currentTab === "insights" ? "active" : ""}`}
          onClick={() => onTabChange("insights")}
          aria-label="Vocabulary"
          title="Vocabulary"
        >
          <span
            className={currentTab === "insights" ? "vocabulary-on-icon" : "vocabulary-off-icon"}
            aria-hidden="true"
          />
        </button>
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
                {showSyncAction && (
                  <div className="nav-sync-status">{syncStatusText}</div>
                )}

                {showSyncAction && (
                  <button
                    type="button"
                    className="nav-account-dropdown-item"
                    onClick={() =>
                      void onSyncNow().catch((error) => {
                        console.warn("Manual sync failed:", error);
                      })
                    }
                    disabled={isSyncing}
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      sync
                    </span>
                    {isSyncing ? "Syncing..." : "Sync now"}
                  </button>
                )}

                <button
                  type="button"
                  className="nav-account-dropdown-item"
                  onClick={handleLogout}
                  disabled={isSyncing}
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
