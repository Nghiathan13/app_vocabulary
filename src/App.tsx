import { useState } from "react";
import "./App.css";
import { Tab } from "./types";
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Home/Home";
import Review from "./components/Review/Review";
import Insights from "./components/Insights/Insights";
import Practice from "./components/Practice/Practice";

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>("home");

  return (
    <main className="container">
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

      {currentTab === "home" && <Home />}
      {currentTab === "review" && <Review />}
      {currentTab === "practice" && <Practice />}
      {currentTab === "insights" && <Insights />}
    </main>
  );
}

export default App;
