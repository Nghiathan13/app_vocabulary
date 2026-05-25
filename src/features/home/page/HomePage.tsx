import Chart from "../../vocabulary/components/Chart/Chart";
import { WordWithId } from "../../../entities/word/model/types";

import "./HomePage.css";

interface HomePageProps {
  words: WordWithId[];
}

export default function HomePage({ words }: HomePageProps) {
  return (
    <div className="home-dashboard">
      <Chart words={words} variant="dashboard" />
    </div>
  );
}
