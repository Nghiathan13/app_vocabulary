import type { Tab } from "../model/tab";

export const ROUTES = {
  home: "/home",
  vocabulary: "/vocabulary",
  review: "/review",
  practice: "/practice",
  login: "/login",
} as const;

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export function tabToPath(tab: Tab): string {
  if (tab === "insights") {
    return ROUTES.vocabulary;
  }

  return ROUTES[tab];
}

export function pathToTab(pathname: string): Tab | null {
  switch (pathname) {
    case ROUTES.home:
      return "home";
    case ROUTES.vocabulary:
      return "insights";
    case ROUTES.review:
      return "review";
    case ROUTES.practice:
      return "practice";
    default:
      return null;
  }
}
