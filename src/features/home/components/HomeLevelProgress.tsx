import type { CSSProperties } from "react";
import { MAX_LEVEL } from "../../../entities/word/lib/wordStats";

interface HomeLevelProgressProps {
  levelDistribution: Array<{ level: number; count: number }>;
  totalWords: number;
}

type MeterStyle = CSSProperties & {
  "--bar-value"?: string;
};

export default function HomeLevelProgress({
  levelDistribution,
  totalWords,
}: HomeLevelProgressProps) {
  return (
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
  );
}
