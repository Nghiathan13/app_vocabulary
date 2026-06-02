export type AppMode = "desktop" | "web";

export const APP_MODE: AppMode =
  import.meta.env.VITE_APP_MODE === "web" ? "web" : "desktop";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const isWebMode = APP_MODE === "web";
export const isDesktopMode = APP_MODE === "desktop";
