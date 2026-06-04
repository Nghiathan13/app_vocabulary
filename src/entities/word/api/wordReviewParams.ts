import type { WordWithId } from "../model/types";

export interface UpdateWordReviewParams {
  /** Full row from store — web PATCH by `id` without re-fetching the list. */
  source: WordWithId;
  level: number;
  wrongCount: number;
  lastReview: string;
  nextReview: string | null;
}
