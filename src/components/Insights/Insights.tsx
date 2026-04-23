import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { WordWithId } from "../../types";
import Table from "./Table/Table";
import Chart from "./Chart/Chart";
import "./Insights.css";

type SubTab = "table" | "chart";

export default function Insights() {
  const [currentSubTab, setCurrentSubTab] = useState<SubTab>("table");
  const [words, setWords] = useState<WordWithId[]>([]);

  const fetchWords = useCallback(async () => {
    try {
      const db = await Database.load("sqlite:vocabulary.db");
      const result = await db.select<WordWithId[]>(
        "SELECT rowid as id, * FROM words ORDER BY word ASC",
      );
      setWords(result);
    } catch (error) {
      console.error("Error fetching words:", error);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  return (
    <div className="insights-container">
      {/* Sub navigation */}
      <div className="sub-nav">
        <button
          className={`sub-nav-btn ${currentSubTab === "table" ? "active" : ""}`}
          onClick={() => setCurrentSubTab("table")}
        >
          Table
        </button>
        <button
          className={`sub-nav-btn ${currentSubTab === "chart" ? "active" : ""}`}
          onClick={() => setCurrentSubTab("chart")}
        >
          Chart
        </button>
      </div>

      {/* Content */}
      <div className="insights-content">
        {currentSubTab === "table" ? (
          <Table words={words} onRefresh={fetchWords} />
        ) : (
          <Chart words={words} />
        )}
      </div>
    </div>
  );
}
