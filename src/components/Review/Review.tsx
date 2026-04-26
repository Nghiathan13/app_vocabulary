import { useState, useEffect, useRef } from "react";
import Database from "@tauri-apps/plugin-sql";
import { Word } from "../../types";
import "./Review.css";

export default function Review() {
  // === STATE ===
  const [reviewWords, setReviewWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // === REFS ===
  const wrapperRef = useRef<HTMLDivElement>(null);

  // === DERIVED STATE ===
  const currentWord = reviewWords[currentIndex];

  // === FUNCTIONS ===
  const loadReviewWords = async () => {
    setIsLoading(true);
    try {
      const db = await Database.load("sqlite:vocabulary.db");

      const result = await db.select<Word[]>(
        `SELECT * FROM words 
         WHERE next_review <= date('now', 'localtime')
         ORDER BY next_review ASC`,
      );

      setReviewWords(result || []);
      setCurrentIndex(0);
      setShowMeaning(false);
    } catch (error) {
      console.error("Lỗi load review words:", error);
      setReviewWords([]);
    }
    setIsLoading(false);
  };

  // === HANDLERS ===
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!currentWord) return;

    if (e.key === " " && !showMeaning) {
      e.preventDefault();
      setShowMeaning(true);
      return;
    }

    if (showMeaning && (e.key === "1" || e.key === "4")) {
      const isForgot = e.key === "1";
      const newReps = isForgot ? 0 : currentWord.reps + 1;

      let daysToAdd = 1;
      if (!isForgot) {
        switch (currentWord.reps) {
          case 0:
            daysToAdd = 2;
            break;
          case 1:
            daysToAdd = 4;
            break;
          case 2:
            daysToAdd = 7;
            break;
          case 3:
            daysToAdd = 15;
            break;
          case 4:
            daysToAdd = 30;
            break;
          case 5:
            daysToAdd = 60;
            break;
          case 6:
            daysToAdd = 0;
            break;
          default:
            daysToAdd = 60;
        }
      }

      try {
        const db = await Database.load("sqlite:vocabulary.db");
        const newNextReview =
          daysToAdd > 0
            ? `date('now', 'localtime', '+${daysToAdd} days')`
            : null;

        await db.execute(
          `UPDATE words 
           SET reps = $1, 
               last_review = date('now', 'localtime'),
               next_review = ${newNextReview ? newNextReview : "NULL"}
           WHERE word = $2`,
          [newReps, currentWord.word],
        );

        if (currentIndex + 1 < reviewWords.length) {
          setCurrentIndex(currentIndex + 1);
          setShowMeaning(false);
        } else {
          setTimeout(() => loadReviewWords(), 300);
        }
      } catch (error) {
        console.error("Lỗi update review:", error);
      }
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    loadReviewWords();
  }, []);

  useEffect(() => {
    if (!isLoading && wrapperRef.current) {
      wrapperRef.current.focus();
    }
  }, [isLoading, currentIndex, showMeaning]);

  // === RENDER ===
  if (isLoading) {
    return <p>Loading</p>;
  }

  if (reviewWords.length === 0) {
    return (
      <div className="no-review">
        <h2>No words to review today</h2>
      </div>
    );
  }

  return (
    <div
      className="review-wrapper"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={wrapperRef}
    >
      {/* === PROGRESS === */}
      <div className="progress-container">
        <div className="progress-text">
          {currentIndex + 1}/{reviewWords.length}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentIndex + 1) / reviewWords.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* === CARD === */}
      <div className="review-card">
        <div className="review-word">
          <div className="word-header">
            <h2>{currentWord.word}</h2>
            <span className="review-type">({currentWord.type || ""})</span>
          </div>
          {currentWord.ipa && <p className="review-ipa">/{currentWord.ipa}/</p>}
        </div>

        <div className={`review-meaning ${showMeaning ? "show" : ""}`}>
          {currentWord.meaning || "Không có nghĩa"}
        </div>
      </div>

      {/* === HINT === */}
      <div className="review-hint">
        {!showMeaning ? <p>space</p> : <p>1 • 4</p>}
      </div>
    </div>
  );
}
