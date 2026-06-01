import type { CSSProperties } from "react";

import { WordWithId } from "../../../entities/word/model/types";
import { Tab } from "../../../shared/model/tab";
import { Button } from "../../../shared/ui/Button/Button";
import { getLocalDateString } from "../../../shared/lib/utils";
import "./HomePage.css";

interface HomePageProps {
  words: WordWithId[];
  onNavigate: (tab: Tab) => void;
}

type MeterStyle = CSSProperties & {
  "--bar-value"?: string;
};

const MAX_LEVEL = 6;
const WRONG_COUNT_THRESHOLD = 5;

const getLevelDistribution = (words: WordWithId[]) =>
  Array.from({ length: MAX_LEVEL + 1 }, (_, level) => ({
    level,
    count: words.filter((word) =>
      level === MAX_LEVEL ? word.level >= MAX_LEVEL : word.level === level,
    ).length,
  }));

const getHighWrongCountWords = (words: WordWithId[]) =>
  words
    .filter((word) => word.wrong_count >= WRONG_COUNT_THRESHOLD)
    .sort((a, b) => {
      if (b.wrong_count !== a.wrong_count) {
        return b.wrong_count - a.wrong_count;
      }

      return a.word.localeCompare(b.word);
    })
    .slice(0, 8);

export default function HomePage({ words, onNavigate }: HomePageProps) {
  const today = getLocalDateString();
  const totalWords = words.length;
  const dueCount = words.filter(
    (word) => word.next_review && word.next_review <= today,
  ).length;
  const masteredWords = words.filter((word) => word.level >= MAX_LEVEL).length;
  const levelDistribution = getLevelDistribution(words);
  const highWrongCountWords = getHighWrongCountWords(words);

  return (
    <main className="home-page" aria-labelledby="home-title">
      {totalWords === 0 ? (
        <section className="home-empty-state">
          <div>
            <h1 id="home-title">No vocabulary yet</h1>
            <p>
              Add your first words in the Vocabulary table. Review stats and
              progress will appear here after you start learning.
            </p>
          </div>
          <Button
            type="button"
            className="home-empty-action"
            variant="primary"
            onClick={() => onNavigate("insights")}
          >
            Open vocabulary
          </Button>
        </section>
      ) : (
        <>
          <section
            className="home-metric-grid"
            aria-label="Learning metrics"
            aria-labelledby="home-title"
          >
            <h1 id="home-title" className="home-sr-title">
              Home dashboard
            </h1>
            <article className="home-card home-metric-card">
              <span className="home-card-label">Words</span>
              <strong>{totalWords}</strong>
              <p>Total saved vocabulary</p>
            </article>

            <article className="home-card home-metric-card">
              <span className="home-card-label">Due</span>
              <strong>{dueCount}</strong>
              <p>Ready for review</p>
            </article>

            <article className="home-card home-metric-card">
              <span className="home-card-label">Mastered</span>
              <strong>{masteredWords}</strong>
              <p>{masteredWords} words at level {MAX_LEVEL}</p>
            </article>
          </section>

          <section className="home-dashboard-grid">
            <article className="home-card home-progress-card">
              <div className="home-card-heading">
                <div>
                  <span className="home-card-label">Review progress</span>
                </div>
              </div>

              <div className="home-level-bars">
                {levelDistribution.map((item) => {
                  const percent =
                    totalWords > 0 ? (item.count / totalWords) * 100 : 0;

                  return (
                    <div className="home-level-row" key={item.level}>
                      <span>Level {item.level === MAX_LEVEL ? "6+" : item.level}</span>
                      <div className="home-bar-track">
                        <div
                          className="home-bar-fill"
                          style={{ "--bar-value": `${percent}%` } as MeterStyle}
                        />
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="home-card home-wrong-card">
              <div className="home-card-heading">
                <div>
                  <span className="home-card-label">Wrong count</span>
                </div>
              </div>

              {highWrongCountWords.length > 0 ? (
                <div className="home-wrong-list">
                  {highWrongCountWords.map((word) => (
                    <div className="home-wrong-row" key={word.id}>
                      <span>{word.word}</span>
                      <strong>{word.wrong_count}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="home-wrong-empty">
                  No words with {WRONG_COUNT_THRESHOLD}+ mistakes.
                </p>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
}
