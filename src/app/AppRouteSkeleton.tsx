import { useLocation } from "react-router-dom";

import HomePageSkeleton from "../features/home/components/HomePageSkeleton";
import PracticePageSkeleton from "../features/practice/components/PracticePageSkeleton";
import ReviewPageSkeleton from "../features/review/components/ReviewPageSkeleton";
import VocabularyPageSkeleton from "../features/vocabulary/components/VocabularyPageSkeleton";
import { ROUTES } from "../shared/lib/routes";
import "./AppRouteSkeleton.css";

export default function AppRouteSkeleton() {
  const { pathname } = useLocation();

  switch (pathname) {
    case ROUTES.vocabulary:
      return <VocabularyPageSkeleton />;
    case ROUTES.review:
      return <ReviewPageSkeleton />;
    case ROUTES.practice:
      return <PracticePageSkeleton />;
    case ROUTES.home:
    case ROUTES.login:
    default:
      return <HomePageSkeleton />;
  }
}
