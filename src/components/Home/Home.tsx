import { useState, useEffect, useRef } from "react";
import Database from "@tauri-apps/plugin-sql";
import { writeFile, exists } from "@tauri-apps/plugin-fs";
import { appConfigDir, join } from "@tauri-apps/api/path";
import { WordType } from "../../types";
import "./Home.css";

const WORD_TYPES: { value: WordType; label: string }[] = [
  { value: "noun", label: "noun" },
  { value: "verb", label: "verb" },
  { value: "adjective", label: "adj" },
  { value: "adverb", label: "adv" },
];

interface HomeProps {
  onWordAdded?: () => void;
}

export default function Home({ onWordAdded }: HomeProps) {
  // === STATE ===
  const [word, setWord] = useState("");
  const [ipa, setIpa] = useState("");
  const [type, setType] = useState<string>("");
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  const [isCustomType, setIsCustomType] = useState(false);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // === EFFECTS ===
  useEffect(() => {
    wordInputRef.current?.focus();
  }, []);

  // === DERIVED STATE ===
  const activeMeanings =
    !type || isCustomType
      ? [meanings["default"] || ""]
      : type.split(" / ").map((t) => meanings[t] || "");

  const isFormValid = Boolean(
    word.trim() && ipa.trim() && type && activeMeanings.every((m) => m.trim()),
  );

  // === HANDLERS ===
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.toLowerCase().replace(/[^a-z\s'-]/g, "");
    setWord(filteredValue);
  };

  const downloadAudio = async (wordToDownload: string) => {
    try {
      const configDir = await appConfigDir();
      const audioDir = await join(configDir, "audio");
      
      // Tên file: thay khoảng trắng và các ký tự đặc biệt (như /) bằng _
      const fileName = wordToDownload.toLowerCase().replace(/[\s/\\?%*:|"<>+]+/g, "_"); 
      const filePath = await join(audioDir, `${fileName}.mp3`);

      // Đã có file rồi thì thôi
      if (await exists(filePath)) return;

      // Lọc bỏ nội dung trong ngoặc đơn để API đọc chuẩn (ví dụ: "in charge (of st)" -> "in charge")
      const cleanWord = wordToDownload.replace(/\s*\([^)]*\)/g, "").trim();

      let audioBuffer: ArrayBuffer | null = null;

      // ── Bước 1: Thử FreeDictionary (chỉ cho từ đơn sau khi đã lọc ngoặc) ──
      if (!cleanWord.includes(" ")) {
        try {
          const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
          );
          if (response.ok) {
            const data = await response.json();
            const audioUrl =
              data[0]?.phonetics?.find((p: any) => p.audio?.includes("uk"))?.audio ||
              data[0]?.phonetics?.find((p: any) => p.audio)?.audio;

            if (audioUrl) {
              const audioResponse = await fetch(audioUrl);
              if (audioResponse.ok) {
                audioBuffer = await audioResponse.arrayBuffer();
              }
            }
          }
        } catch {
          // Fallback bên dưới
        }
      }

      // ── Bước 2: Fallback VoiceRSS ──
      if (!audioBuffer) {
        const VOICERSS_KEY = import.meta.env.VITE_VOICERSS_KEY;
        if (!VOICERSS_KEY) {
          console.error("Thiếu VOICERSS_KEY trong file .env");
          return;
        }

        const params = new URLSearchParams({
          key: VOICERSS_KEY,
          hl: "en-gb",
          src: cleanWord, // Dùng cleanWord đã lọc ngoặc
          c: "MP3",
          f: "44khz_16bit_stereo",
        });

        const voiceResponse = await fetch(
          `https://api.voicerss.org/?${params.toString()}`
        );

        const contentType = voiceResponse.headers.get("content-type") || "";
        if (voiceResponse.ok && contentType.includes("audio")) {
          audioBuffer = await voiceResponse.arrayBuffer();
        } else {
          const errText = await voiceResponse.text();
          console.error("VoiceRSS error:", errText);
          return;
        }
      }

      // ── Bước 3: Lưu file ──
      if (audioBuffer) {
        await writeFile(filePath, new Uint8Array(audioBuffer));
        console.log(`Đã tải audio: ${fileName}.mp3`);
      }
    } catch (error) {
      console.error(`Lỗi khi tải audio cho "${wordToDownload}":`, error);
    }
  };

  const handleAdd = async () => {
    if (!isFormValid) return;
    try {
      const db = await Database.load("sqlite:vocabulary.db");

      const finalMeaning = activeMeanings
        .map((v) => v.trim().toLowerCase())
        .join(" / ");

      await db.execute(
        `INSERT INTO words (word, ipa, type, meaning, reps, last_review, next_review) 
         VALUES ($1, $2, $3, $4, 0, NULL, date('now', 'localtime', '+1 day'))`,
        [
          word.trim().toLowerCase(),
          ipa.trim(),
          type.trim().toLowerCase(),
          finalMeaning,
        ],
      );

      // Tải audio ngầm (không đợi)
      downloadAudio(word.trim().toLowerCase());

      setWord("");
      setIpa("");
      setType("");
      setMeanings({});
      setIsCustomType(false);
      wordInputRef.current?.focus();
      
      if (onWordAdded) {
        onWordAdded();
      }
    } catch (error) {
      console.error("Lỗi khi thêm từ:", error);
    }
  };

  const handleTypeToggle = (value: string) => {
    if (isCustomType) {
      setIsCustomType(false);
      setType(value);
      return;
    }

    let currentTypes = type ? type.split(" / ") : [];

    if (currentTypes.includes(value)) {
      currentTypes = currentTypes.filter((t) => t !== value);
    } else {
      currentTypes.push(value);
    }

    currentTypes.sort((a, b) => {
      const indexA = WORD_TYPES.findIndex((t) => t.value === a);
      const indexB = WORD_TYPES.findIndex((t) => t.value === b);
      return indexA - indexB;
    });

    setType(currentTypes.join(" / "));
  };

  return (
    <div className="form-wrapper">
      {/* === HEADER === */}
      <div className="form-header">
        <h1>English Vocabulary</h1>
      </div>

      {/* === BODY === */}
      <div className="form-body">
        <div className="field-row">
          <div className={`field${word ? " has-value" : ""}`}>
            <label className="field-label" htmlFor="word">
              WORD
            </label>
            <input
              ref={wordInputRef}
              type="text"
              name="word"
              id="word"
              value={word}
              onChange={handleInputChange}
              placeholder="executive"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </div>

          <div className={`field${ipa ? " has-value" : ""}`}>
            <label className="field-label" htmlFor="ipa">
              IPA
            </label>
            <input
              type="text"
              name="ipa"
              id="ipa"
              value={ipa}
              onChange={(e) => setIpa(e.target.value)}
              placeholder="ɪɡˈzek.jə.tɪv"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
        <div className={`field${type || isCustomType ? " has-value" : ""}`}>
          <label className="field-label" htmlFor="type">
            TYPE
          </label>
          <div className="type-pills">
            {WORD_TYPES.map(({ value, label }) => {
              const isSelected =
                !isCustomType &&
                (type ? type.split(" / ").includes(value) : false);
              return (
                <button
                  key={value}
                  className={`type-pill ${isSelected ? "selected" : ""}`}
                  onClick={() => handleTypeToggle(value)}
                >
                  {label}
                </button>
              );
            })}
            <button
              className={`type-pill ${isCustomType ? "selected" : ""}`}
              onClick={() => {
                setIsCustomType(!isCustomType);
                setType("");
              }}
            >
              ≠
            </button>
          </div>
          {isCustomType && (
            <input
              type="text"
              name="custom-type"
              id="custom-type"
              value={type}
              onChange={(e) => setType(e.target.value.toLowerCase())}
              placeholder="phrase"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          )}
        </div>

        <div
          className={`field${activeMeanings.some((v) => v) ? " has-value" : ""}`}
        >
          <label className="field-label" htmlFor="meaning">
            MEANING
          </label>
          {!type || isCustomType ? (
            <input
              type="text"
              name="meaning-default"
              value={meanings["default"] || ""}
              onChange={(e) =>
                setMeanings({ ...meanings, default: e.target.value })
              }
              placeholder=""
              autoComplete="off"
              spellCheck={false}
            />
          ) : (
            type
              .split(" / ")
              .map((t) => (
                <input
                  key={`meaning-${t}`}
                  type="text"
                  name={`meaning-${t}`}
                  value={meanings[t] || ""}
                  onChange={(e) =>
                    setMeanings({ ...meanings, [t]: e.target.value })
                  }
                  placeholder={t}
                  autoComplete="off"
                  spellCheck={false}
                />
              ))
          )}
        </div>
      </div>

      {/* === ACTION === */}
      <div className="form-actions">
        <button className="btn-add" onClick={handleAdd} disabled={!isFormValid}>
          Add
        </button>
      </div>
    </div>
  );
}
