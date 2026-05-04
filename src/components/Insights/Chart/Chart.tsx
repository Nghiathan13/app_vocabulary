import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { WordWithId } from "../../../types";
import "./Chart.css";

interface ChartProps {
  words: WordWithId[];
}

export default function Chart({ words }: ChartProps) {
  const chartData = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const word of words) {
      counts[word.reps] = (counts[word.reps] || 0) + 1;
    }

    return Object.keys(counts)
      .map((rep) => ({
        reps: `Rep ${rep}`,
        rawReps: Number(rep),
        count: counts[Number(rep)],
      }))
      .sort((a, b) => a.rawReps - b.rawReps);
  }, [words]);

  return (
    <div className="chart-wrapper">
      <div className="chart-container">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgb(60, 60, 60)"
                vertical={false}
              />
              <XAxis
                dataKey="reps"
                stroke="rgb(120, 120, 120)"
                tick={{ fill: "rgb(120, 120, 120)", fontSize: 14 }}
                tickLine={false}
                axisLine={{ stroke: "rgb(60, 60, 60)" }}
              />
              <YAxis
                stroke="rgb(120, 120, 120)"
                tick={{ fill: "rgb(120, 120, 120)", fontSize: 14 }}
                tickLine={false}
                axisLine={{ stroke: "rgb(60, 60, 60)" }}
                allowDecimals={false}
              />
              <Bar
                dataKey="count"
                name="Words"
                fill="rgb(120, 120, 120)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="count"
                  position="top"
                  fill="rgb(210, 210, 210)"
                  fontSize={14}
                  offset={8}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">No data available</div>
        )}
      </div>
      <div className="chart-footer">
        Total words: {words.length}
      </div>
    </div>
  );
}
