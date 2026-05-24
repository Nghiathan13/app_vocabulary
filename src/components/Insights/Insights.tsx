// -- React --
import { useState } from "react";

// -- Components --
import Table from "./Table/Table";
import Chart from "./Chart/Chart";

// -- Types & Utils --
import { WordWithId } from "../../entities/word/model/types";

// -- Style --
import "./Insights.css";

type SubTab = "table" | "chart";

interface InsightsProps {
  words: WordWithId[];
  onRefresh: () => void;
  onWordDeleted: (wordId: number) => void;
}

export default function Insights({
  words,
  onRefresh,
  onWordDeleted,
}: InsightsProps) {
  // === STATE ===
  const [currentSubTab, setCurrentSubTab] = useState<SubTab>("table");

  // === RENDER ===
  return (
    <div className="insights-container">
      {/* === SUB NAVIGATION === */}
      <div className="sub-nav">
        <button
          className={`sub-nav-btn ${currentSubTab === "table" ? "active" : ""}`}
          onClick={() => setCurrentSubTab("table")}
        >
          <span className="material-symbols-outlined">table</span>
        </button>
        <button
          className={`sub-nav-btn ${currentSubTab === "chart" ? "active" : ""}`}
          onClick={() => setCurrentSubTab("chart")}
        >
          <span className="material-symbols-outlined">insert_chart</span>
        </button>
      </div>

      {/* === CONTENT === */}
      <div className="insights-content">
        {currentSubTab === "table" ? (
          <Table
            words={words}
            onRefresh={onRefresh}
            onWordDeleted={onWordDeleted}
          />
        ) : (
          <Chart words={words} />
        )}
      </div>
    </div>
  );
}
