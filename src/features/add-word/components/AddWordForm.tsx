import { useState, useEffect, useRef } from "react";

import { WordType, WordWithId } from "../../../entities/word/model/types";
import { downloadAudio } from "../../../shared/api/audio";
import { insertWord } from "../../../entities/word/api/words";
import { useToast } from "../../../shared/ui/Toast/ToastProvider";

import "./AddWordForm.css";

const WORD_TYPES: { value: WordType; label: string }[] = [
  { value: "noun", label: "noun" },
  { value: "verb", label: "verb" },
  { value: "adjective", label: "adj" },
  { value: "adverb", label: "adv" },
];

interface AddWordFormProps {
  onWordAdded?: (newWord: WordWithId) => void;
  onWordAudioReady?: (wordId: number) => void;
  onAdded?: () => void;
}

export default function AddWordForm({
  onWordAdded,
  onWordAudioReady,
  onAdded,
}: AddWordFormProps) {
  const [word, setWord] = useState("");
  const [ipa, setIpa] = useState("");
  const [type, setType] = useState<string>("");
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  const [isCustomType, setIsCustomType] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wordInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const activeMeanings =
    !type || isCustomType
      ? [meanings["default"] || ""]
      : type.split(" / ").map((t) => meanings[t] || "");

  const isFormValid = Boolean(
    word.trim() && ipa.trim() && type && activeMeanings.every((m) => m.trim()),
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.toLowerCase().replace(/[^a-z\s'-]/g, "");
    setWord(filteredValue);
  };

  const handleAdd = async () => {
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const normalizedWord = word.trim().toLowerCase();
      const normalizedType = type.trim().toLowerCase();
      const normalizedIpa = ipa.trim();
      const finalMeaning = activeMeanings
        .map((v) => v.trim().toLowerCase())
        .join(" / ");
      const newWord = await insertWord({
        word: normalizedWord,
        ipa: normalizedIpa,
        type: normalizedType,
        meaning: finalMeaning,
      });

      onWordAdded?.(newWord);
      showToast({
        message: `Added "${normalizedWord}"`,
        type: "success",
      });
      onAdded?.();

      void (async () => {
        const hasAudio = await downloadAudio(normalizedWord);
        if (hasAudio) {
          onWordAudioReady?.(newWord.id);
          showToast({
            message: `Audio ready for "${normalizedWord}"`,
            type: "success",
          });
          return;
        }

        showToast({
          message: `Failed to download audio for "${normalizedWord}"`,
          type: "error",
        });
      })();

      setWord("");
      setIpa("");
      setType("");
      setMeanings({});
      setIsCustomType(false);
      wordInputRef.current?.focus();
    } catch (error) {
      showToast({
        message: "Failed to add word",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
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

  useEffect(() => {
    wordInputRef.current?.focus();
  }, []);

  return (
    <>
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
                  type="button"
                  className={`type-pill ${isSelected ? "selected" : ""}`}
                  onClick={() => handleTypeToggle(value)}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
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

      <div className="form-actions">
        <button
          type="button"
          className="btn-add"
          onClick={handleAdd}
          disabled={!isFormValid || isSubmitting}
        >
          Add
        </button>
      </div>
    </>
  );
}
