import { MAX_LEVEL } from "../../../entities/word/lib/wordStats";

interface HomeMetricGridProps {
  totalWords: number;
  dueCount: number;
  masteredWords: number;
}

export default function HomeMetricGrid({
  totalWords,
  dueCount,
  masteredWords,
}: HomeMetricGridProps) {
  return (
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
  );
}
