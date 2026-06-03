import type { AuthUser } from "../api/auth";

export const AUTH_ACCESS_TOKEN_KEY = "engvocab-access-token";
export const AUTH_REFRESH_TOKEN_KEY = "engvocab-refresh-token";
export const AUTH_USER_KEY = "engvocab-user";
export const AUTH_RETURN_PATH_KEY = "engvocab-return-path";

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

export function readStoredSession(): StoredSession {
  const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
  const userRaw = localStorage.getItem(AUTH_USER_KEY);

  let user: AuthUser | null = null;

  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as AuthUser;
    } catch {
      user = null;
    }
  }

  return { accessToken, refreshToken, user };
}

export function writeStoredSession({
  accessToken,
  refreshToken,
  user,
}: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function saveReturnPath(path: string) {
  sessionStorage.setItem(AUTH_RETURN_PATH_KEY, path);
}

export function consumeReturnPath(fallback: string): string {
  const path = sessionStorage.getItem(AUTH_RETURN_PATH_KEY);

  if (path) {
    sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
    return path;
  }

  return fallback;
}
