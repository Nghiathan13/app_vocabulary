import { WordWithId } from "../../../entities/word/model/types";
import { getLocalDateString } from "../../../shared/lib/utils";
import {
  getDueCount,
  getHighWrongCountWords,
  getLevelDistribution,
  getMasteredCount,
} from "../../../entities/word/lib/wordStats";
import HomeEmptyState from "../components/HomeEmptyState";
import HomeMetricGrid from "../components/HomeMetricGrid";
import HomeLevelProgress from "../components/HomeLevelProgress";
import HomeWrongCountList from "../components/HomeWrongCountList";
import "./HomePage.css";

interface HomePageProps {
  words: WordWithId[];
}

export default function HomePage({ words }: HomePageProps) {
  const today = getLocalDateString();
  const totalWords = words.length;
  const dueCount = getDueCount(words, today);
  const masteredWords = getMasteredCount(words);
  const levelDistribution = getLevelDistribution(words);
  const highWrongCountWords = getHighWrongCountWords(words);

  return (
    <section className="home-page" aria-labelledby="home-title">
      {totalWords === 0 ? (
        <HomeEmptyState />
      ) : (
        <>
          <HomeMetricGrid
            totalWords={totalWords}
            dueCount={dueCount}
            masteredWords={masteredWords}
          />

          <section className="home-dashboard-grid">
            <HomeLevelProgress
              levelDistribution={levelDistribution}
              totalWords={totalWords}
            />

            <HomeWrongCountList
              highWrongCountWords={highWrongCountWords}
            />
          </section>
        </>
      )}
    </section>
  );
}
