import { WordWithId } from "../../../types";
import "./Chart.css";

interface ChartProps {
  words: WordWithId[];
}

export default function Chart({ words }: ChartProps) {
  return (
    <div className="chart-wrapper">
      <h1>Chart View</h1>
      <p>Charts and analytics for {words.length} words will be displayed here.</p>
    </div>
  );
}
