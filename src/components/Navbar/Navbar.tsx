import { Tab } from "../../types";
import logo from "../../assets/logo.svg";
import "./Navbar.css";

interface NavbarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Navbar({ currentTab, onTabChange }: NavbarProps) {
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
          <span className="material-symbols-outlined">cards_star</span>
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
          aria-label="Insights"
          title="Insights"
        >
          <span className="material-symbols-outlined">database</span>
        </button>
      </div>

      {/* === RIGHT === */}
      <div className="navbar-right">
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
