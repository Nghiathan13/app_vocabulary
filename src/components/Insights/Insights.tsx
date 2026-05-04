import { useState } from "react";
import { WordWithId } from "../../types";
import Table from "./Table/Table";
import Chart from "./Chart/Chart";
import "./Insights.css";

type SubTab = "table" | "chart";

interface InsightsProps {
  words: WordWithId[];
  onRefresh: () => void;
}

export default function Insights({ words, onRefresh }: InsightsProps) {
  // === STATE ===
  const [currentSubTab, setCurrentSubTab] = useState<SubTab>("table");

  return (
    <div className="insights-container">
      {/* === SUB NAVIGATION === */}
      <div className="sub-nav">
        <button
          className={`sub-nav-btn ${currentSubTab === "table" ? "active" : ""}`}
          onClick={() => setCurrentSubTab("table")}
        >
          <span className="material-symbols-outlined">table_rows</span>
        </button>
        <button
          className={`sub-nav-btn ${currentSubTab === "chart" ? "active" : ""}`}
          onClick={() => setCurrentSubTab("chart")}
        >
          <span className="material-symbols-outlined">bar_chart</span>
        </button>
      </div>

      {/* === CONTENT === */}
      <div className="insights-content">
        {currentSubTab === "table" ? (
          <Table words={words} onRefresh={onRefresh} />
        ) : (
          <Chart words={words} />
        )}
      </div>
    </div>
  );
}
