// -- Types & Utils --
import { Tab } from "../../model/tab";

// -- Style --
import logo from "../../../assets/logo.svg";
import "./Navbar.css";

type AppTheme = "dark" | "light";

interface NavbarProps {
  currentTab: Tab;
  theme: AppTheme;
  onTabChange: (tab: Tab) => void;
  onThemeToggle: () => void;
}

export default function Navbar({
  currentTab,
  theme,
  onTabChange,
  onThemeToggle,
}: NavbarProps) {
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

        <button
          className="nav-settings-btn"
          type="button"
          aria-label="Settings"
          title="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </nav>
  );
}
