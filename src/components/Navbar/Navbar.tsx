import { Tab } from "../../types";
import "./Navbar.css";

interface NavbarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Navbar({ currentTab, onTabChange }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className={`nav-btn ${currentTab === "home" ? "active" : ""}`}
          onClick={() => onTabChange("home")}
        >
          Home
        </button>
      </div>

      <div className="navbar-center">
        <button
          className={`nav-btn ${currentTab === "review" ? "active" : ""}`}
          onClick={() => onTabChange("review")}
        >
          Review
        </button>
        <button
          className={`nav-btn ${currentTab === "practice" ? "active" : ""}`}
          onClick={() => onTabChange("practice")}
        >
          Practice
        </button>
        <button
          className={`nav-btn ${currentTab === "insights" ? "active" : ""}`}
          onClick={() => onTabChange("insights")}
        >
          Insights
        </button>
      </div>

      <div className="navbar-right">
        <button className="nav-btn">Setting</button>
      </div>
    </nav>
  );
}
