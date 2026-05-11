// -- React --
import { useState, useEffect, useRef, useCallback } from "react";

// -- Tauri --
import Database from "@tauri-apps/plugin-sql";
import { readDir } from "@tauri-apps/plugin-fs";
import { appConfigDir, join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

// -- Types & Utils --
import { WordWithId } from "../../types";
import { getAudioFileName, getAudioPath, getLocalDateString } from "../../utils";

// -- Style --
import "./Review.css";

interface ReviewProps {
  onReviewUpdate?: (word: string, updates: Partial<WordWithId>) => void;
}

export default function Review({ onReviewUpdate }: ReviewProps) {
  // === STATE ===
  const [reviewWords, setReviewWords] = useState<WordWithId[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  // === REFS ===
  const wrapperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // === DERIVED STATE ===
  const currentWord = reviewWords[currentIndex];

  // === FUNCTIONS ===
  const loadReviewWords = async () => {
    setIsLoading(true);
    try {
      const db = await Database.load("sqlite:vocabulary.db");

      const result = await db.select<WordWithId[]>(
        `SELECT rowid as id, * FROM words 
         WHERE next_review <= date('now', 'localtime')
         ORDER BY next_review ASC`,
      );

      // --- QUÉT THƯ MỤC AUDIO ---
      let audioFiles = new Set<string>();
      try {
        const configDir = await appConfigDir();
        const audioDir = await join(configDir, "audio");
        const entries = await readDir(audioDir);
        audioFiles = new Set(entries.map((e) => e.name.toLowerCase()));
      } catch (error) {
        console.warn("Không thể quét thư mục audio:", error);
      }

      const wordsWithAudio = result.map((w) => {
        const fileName = getAudioFileName(w.word);
        return {
          ...w,
          hasAudio: audioFiles.has(fileName.toLowerCase()),
        };
      });

      setReviewWords(wordsWithAudio);
      setCurrentIndex(0);
      setShowMeaning(false);
    } catch (error) {
      console.error("Lỗi load review words:", error);
      setReviewWords([]);
    }
    setIsLoading(false);
  };

  // === HANDLERS ===
  const handlePronounce = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { });
    }
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!currentWord) return;

    if (e.key === " ") {
      e.preventDefault();
      if (!showMeaning) {
        setShowMeaning(true);
      }
      return;
    }

    if (e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (hasAudio) {
        handlePronounce();
      }
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
          daysToAdd > 0 ? getLocalDateString(daysToAdd) : null;
        const newLastReview = getLocalDateString(0);

        await db.execute(
          `UPDATE words 
           SET reps = $1, 
               last_review = $2,
               next_review = $3
           WHERE word = $4`,
          [newReps, newLastReview, newNextReview, currentWord.word],
        );

        if (currentIndex + 1 < reviewWords.length) {
          setCurrentIndex(currentIndex + 1);
          setShowMeaning(false);
        } else {
          setTimeout(() => loadReviewWords(), 300);
        }

        if (onReviewUpdate) {
          onReviewUpdate(currentWord.word, {
            reps: newReps,
            last_review: newLastReview,
            next_review: newNextReview,
          });
        }
      } catch (error) {
        console.error("Lỗi update review:", error);
      }
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    if (!currentWord) {
      audioRef.current = null;
      return;
    }

    const loadAudio = async () => {
      try {
        if (currentWord.hasAudio) {
          const audioPath = await getAudioPath(currentWord.word);

          const binaryData = await invoke<number[]>("read_binary_file", { path: audioPath });
          const blob = new Blob([new Uint8Array(binaryData)], { type: "audio/mpeg" });
          const assetUrl = URL.createObjectURL(blob);

          const audio = new Audio(assetUrl);
          audio.preload = "auto";
          audioRef.current = audio;
          setHasAudio(true);
        } else {
          audioRef.current = null;
          setHasAudio(false);
        }
      } catch (error) {
        console.error("Lỗi khi khi load audio cục bộ:", error);
        audioRef.current = null;
        setHasAudio(false);
      }
    };

    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentWord]);

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
          {currentWord.ipa && (
            <p className="review-ipa">
              <button
                className={`pronounce-btn has-tooltip tooltip-center ${!hasAudio ? "disabled" : ""}`}
                onClick={hasAudio ? handlePronounce : undefined}
                type="button"
                data-tooltip={hasAudio ? "Pronunciation (A)" : "Không có file âm thanh"}
              >
                <span className="material-symbols-outlined">volume_up</span>
              </button>
              /{currentWord.ipa}/
            </p>
          )}
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
