// -- React --
import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";

// -- Tauri --
import Database from "@tauri-apps/plugin-sql";
import { readDir } from "@tauri-apps/plugin-fs";
import { appConfigDir, join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

// -- Types & Utils --
import { WordWithId } from "../../../entities/word/model/types";
import {
  getAudioFileName,
  getAudioPath,
  getLocalDateString,
} from "../../../shared/lib/utils";
import { getSpacedRepetitionUpdate } from "../lib/spacedRepetition";
import {
  compareTypingAnswer,
  getTypingAnswer,
} from "../lib/typing";

// -- Style --
import "./ReviewPage.css";

const AUDIO_PREROLL_DELAY_MS = 500;
const SILENT_WARMUP_SECONDS = 0.2;
const SILENT_WARMUP_SAMPLE_RATE = 8000;
const REVIEW_MODE_STORAGE_KEY = "reviewMode";
const TYPING_INPUT_MAX_WIDTH = 360;
const TYPING_UNDERLINE_EXTRA_WIDTH = 28;
const TYPING_FIELD_VIEWPORT_MARGIN = 96;

type ReviewMode = "flashcard" | "typing";
type TypingFieldStyle = CSSProperties & { "--typing-field-width": string };

interface TypingResult {
  isCorrect: boolean;
  submittedAnswer: string;
}

const getInitialReviewMode = (): ReviewMode => {
  return localStorage.getItem(REVIEW_MODE_STORAGE_KEY) === "typing"
    ? "typing"
    : "flashcard";
};

const splitTypeLabels = (type: string | null) => {
  return (type || "")
    .split(/[,/;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const getTypePillClassName = (type: string | null) => {
  const normalizedType = type?.trim().toLowerCase() || "";

  if (normalizedType.includes("phrasal")) {
    return "type-pill-review type-pill-phrasal";
  }
  if (normalizedType === "adverb" || normalizedType === "adv") {
    return "type-pill-review type-pill-adverb";
  }
  if (normalizedType === "preposition" || normalizedType === "prep") {
    return "type-pill-review type-pill-preposition";
  }
  if (normalizedType === "noun") {
    return "type-pill-review type-pill-noun";
  }
  if (normalizedType === "adjective" || normalizedType === "adj") {
    return "type-pill-review type-pill-adjective";
  }
  if (normalizedType === "verb") {
    return "type-pill-review type-pill-verb";
  }
  return "type-pill-review type-pill-default";
};

const formatTypeLabel = (type: string | null) => {
  if (!type) {
    return "";
  }
  return type;
};

const createSilentWarmupUrl = () => {
  const sampleCount = Math.ceil(
    SILENT_WARMUP_SAMPLE_RATE * SILENT_WARMUP_SECONDS,
  );
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SILENT_WARMUP_SAMPLE_RATE, true);
  view.setUint32(28, SILENT_WARMUP_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
};

interface ReviewPageProps {
  onReviewUpdate?: (word: string, updates: Partial<WordWithId>) => void;
}

export default function ReviewPage({ onReviewUpdate }: ReviewPageProps) {
  // === STATE ===
  const [reviewWords, setReviewWords] = useState<WordWithId[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [reviewMode, setReviewMode] =
    useState<ReviewMode>(getInitialReviewMode);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [typingResult, setTypingResult] = useState<TypingResult | null>(null);
  const [typingFieldWidth, setTypingFieldWidth] = useState(0);

  // === REFS ===
  const wrapperRef = useRef<HTMLDivElement>(null);
  const typingInputRef = useRef<HTMLInputElement>(null);
  const typingMeasureRef = useRef<HTMLSpanElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const warmupAudioRef = useRef<HTMLAudioElement | null>(null);
  const silentWarmupUrlRef = useRef<string | null>(null);
  const pronounceTimerRef = useRef<number | null>(null);
  const autoPlayedWordIdRef = useRef<number | null>(null);

  // === DERIVED STATE ===
  const currentWord = reviewWords[currentIndex];
  const isTypingMode = reviewMode === "typing";
  const canGradeCurrentWord = isTypingMode ? Boolean(typingResult) : showMeaning;
  const typingFieldText = typedAnswer || "Type the word";
  const typingFieldStyle: TypingFieldStyle = {
    "--typing-field-width": `${typingFieldWidth || 156}px`,
  };

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
      setTypedAnswer("");
      setTypingResult(null);
    } catch (error) {
      console.error("Lỗi load review words:", error);
      setReviewWords([]);
    }
    setIsLoading(false);
  };

  // === HANDLERS ===
  const stopCurrentAudio = useCallback(() => {
    if (pronounceTimerRef.current !== null) {
      window.clearTimeout(pronounceTimerRef.current);
      pronounceTimerRef.current = null;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }

    if (warmupAudioRef.current) {
      warmupAudioRef.current.pause();
      warmupAudioRef.current.currentTime = 0;
      warmupAudioRef.current = null;
    }
  }, []);

  const playCurrentAudio = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    const audio = audioRef.current.cloneNode(true) as HTMLAudioElement;
    activeAudioRef.current = audio;
    audio.onended = () => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
    };

    audio.play().catch(() => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
    });
  }, []);

  const handlePronounce = useCallback(
    (onStart?: () => void) => {
      if (!audioRef.current) {
        return;
      }

      stopCurrentAudio();

      if (!silentWarmupUrlRef.current) {
        silentWarmupUrlRef.current = createSilentWarmupUrl();
      }

      const warmupAudio = new Audio(silentWarmupUrlRef.current);
      warmupAudioRef.current = warmupAudio;
      warmupAudio.play().catch(() => {});

      pronounceTimerRef.current = window.setTimeout(() => {
        pronounceTimerRef.current = null;
        onStart?.();
        playCurrentAudio();
      }, AUDIO_PREROLL_DELAY_MS);
    },
    [playCurrentAudio, stopCurrentAudio],
  );

  const handleReviewModeChange = (mode: ReviewMode) => {
    setReviewMode(mode);
    localStorage.setItem(REVIEW_MODE_STORAGE_KEY, mode);
    setShowMeaning(false);
    setTypedAnswer("");
    setTypingResult(null);
  };

  const handleTypingSubmit = () => {
    if (!currentWord || typingResult) {
      return;
    }

    const submittedAnswer = typedAnswer.trim();
    setTypingResult({
      isCorrect: compareTypingAnswer(currentWord.word, submittedAnswer),
      submittedAnswer,
    });
  };

  const handleReviewGrade = async (isForgot: boolean) => {
    if (!currentWord) {
      return;
    }

    const { nextReps: newReps, daysToAdd } = getSpacedRepetitionUpdate(
      currentWord.reps,
      isForgot,
    );

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
        setTypedAnswer("");
        setTypingResult(null);
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
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!currentWord) return;

    const isInputTarget =
      e.target instanceof HTMLElement &&
      (e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable);

    if (isTypingMode) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTypingSubmit();
        return;
      }

      if (canGradeCurrentWord && (e.key === "1" || e.key === "4")) {
        e.preventDefault();
        await handleReviewGrade(e.key === "1");
        return;
      }

      if (!isInputTarget && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (hasAudio) {
          handlePronounce();
        }
      }

      return;
    }

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

    if (canGradeCurrentWord && (e.key === "1" || e.key === "4")) {
      await handleReviewGrade(e.key === "1");
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    const clearAudio = () => {
      stopCurrentAudio();

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };

    if (!currentWord) {
      clearAudio();
      setHasAudio(false);
      return;
    }

    let isCancelled = false;

    const loadAudio = async () => {
      try {
        if (currentWord.hasAudio) {
          const audioPath = await getAudioPath(currentWord.word);

          const binaryData = await invoke<number[]>("read_binary_file", {
            path: audioPath,
          });
          if (isCancelled) {
            return;
          }

          const blob = new Blob([new Uint8Array(binaryData)], {
            type: "audio/mpeg",
          });
          const assetUrl = URL.createObjectURL(blob);

          const audio = new Audio(assetUrl);
          audio.preload = "auto";
          audio.load();
          audioUrlRef.current = assetUrl;
          audioRef.current = audio;

          setHasAudio(true);

          if (autoPlayedWordIdRef.current !== currentWord.id) {
            const wordId = currentWord.id;
            handlePronounce(() => {
              autoPlayedWordIdRef.current = wordId;
            });
          }
        } else {
          clearAudio();
          setHasAudio(false);
        }
      } catch (error) {
        console.error("Lỗi khi khi load audio cục bộ:", error);
        clearAudio();
        setHasAudio(false);
      }
    };

    loadAudio();

    return () => {
      isCancelled = true;
      clearAudio();
    };
  }, [currentWord, handlePronounce, stopCurrentAudio]);

  useEffect(() => {
    return () => {
      if (silentWarmupUrlRef.current) {
        URL.revokeObjectURL(silentWarmupUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setShowMeaning(false);
    setTypedAnswer("");
    setTypingResult(null);
  }, [currentWord?.id, reviewMode]);

  useLayoutEffect(() => {
    const measure = typingMeasureRef.current;
    if (!measure) {
      return;
    }

    const width =
      Math.ceil(measure.getBoundingClientRect().width) +
      TYPING_UNDERLINE_EXTRA_WIDTH +
      16;
    setTypingFieldWidth(width);

    const animationFrame = window.requestAnimationFrame(() => {
      const maxFieldWidth = Math.min(
        TYPING_INPUT_MAX_WIDTH + TYPING_UNDERLINE_EXTRA_WIDTH,
        window.innerWidth - TYPING_FIELD_VIEWPORT_MARGIN,
      );

      if (width <= maxFieldWidth) {
        typingInputRef.current?.scrollTo({ left: 0 });
      }
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [typingFieldText]);

  useEffect(() => {
    loadReviewWords();
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isTypingMode && !typingResult) {
      typingInputRef.current?.focus();
      return;
    }

    wrapperRef.current?.focus();
  }, [isLoading, currentIndex, showMeaning, isTypingMode, typingResult]);

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
      <div className="review-mode-toggle" role="tablist">
        <button
          className={`review-mode-btn ${reviewMode === "flashcard" ? "active" : ""}`}
          onClick={() => handleReviewModeChange("flashcard")}
          type="button"
        >
          <span className="material-symbols-outlined">style</span>
          Flashcard
        </button>
        <button
          className={`review-mode-btn ${reviewMode === "typing" ? "active" : ""}`}
          onClick={() => handleReviewModeChange("typing")}
          type="button"
        >
          <span className="material-symbols-outlined">keyboard</span>
          Keyboard
        </button>
      </div>

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
      {isTypingMode ? (
        <div className="review-card typing-card">
          <div className="typing-panel">
            <div className="typing-audio-row">
              <button
                className={`typing-audio-btn has-tooltip tooltip-center ${!hasAudio ? "disabled" : ""}`}
                onClick={hasAudio ? () => handlePronounce() : undefined}
                type="button"
                data-tooltip={
                  hasAudio ? "Pronunciation (A)" : "Không có file âm thanh"
                }
              >
                <span className="material-symbols-outlined">volume_up</span>
              </button>
              {currentWord.type && (
                <div className="type-pill-list">
                  {splitTypeLabels(currentWord.type).map((typePart) => (
                    <span
                      className={getTypePillClassName(typePart)}
                      key={`${currentWord.id}-${typePart}`}
                    >
                      {formatTypeLabel(typePart)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`review-typing-field ${typedAnswer ? "has-value" : ""}`}
              style={typingFieldStyle}
            >
              <span
                ref={typingMeasureRef}
                className="review-typing-measure"
                aria-hidden="true"
              >
                {typingFieldText}
              </span>
              <input
                ref={typingInputRef}
                className="review-typing-input"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type the word"
                autoComplete="off"
                spellCheck={false}
                readOnly={Boolean(typingResult)}
              />
            </div>

            <div className="typing-result">
              {typingResult && (
                <>
                  <div
                    className={`typing-result-label ${
                      typingResult.isCorrect ? "correct" : "wrong"
                    }`}
                  >
                    {typingResult.isCorrect ? "Correct" : "Incorrect"}
                  </div>
                  <div className="typing-answer-line">
                    <span>Answer</span>
                    <strong>{getTypingAnswer(currentWord.word)}</strong>
                  </div>
                  {!typingResult.isCorrect && (
                    <div className="typing-answer-line typed-answer">
                      <span>You typed</span>
                      <strong>{typingResult.submittedAnswer || "-"}</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="review-card">
          <div className="review-word">
            <div className="word-header">
              <h2>{currentWord.word}</h2>
              {currentWord.type && (
                <div className="type-pill-list">
                  {splitTypeLabels(currentWord.type).map((typePart) => (
                    <span
                      className={getTypePillClassName(typePart)}
                      key={`${currentWord.id}-${typePart}`}
                    >
                      {formatTypeLabel(typePart)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {currentWord.ipa && (
              <p className="review-ipa">
                <button
                  className={`pronounce-btn has-tooltip tooltip-center ${!hasAudio ? "disabled" : ""}`}
                  onClick={hasAudio ? () => handlePronounce() : undefined}
                  type="button"
                  data-tooltip={
                    hasAudio ? "Pronunciation (A)" : "Không có file âm thanh"
                  }
                >
                  <span className="material-symbols-outlined">volume_up</span>
                </button>
                <span>/{currentWord.ipa}/</span>
              </p>
            )}
          </div>

          <div className={`review-meaning ${showMeaning ? "show" : ""}`}>
            {currentWord.meaning || "Không có nghĩa"}
          </div>
        </div>
      )}

      {/* === HINT === */}
      <div className="review-hint">
        {isTypingMode ? (
          <p>{typingResult ? "1 • 4" : "enter"}</p>
        ) : !showMeaning ? (
          <p>space</p>
        ) : (
          <p>1 • 4</p>
        )}
      </div>
    </div>
  );
}
