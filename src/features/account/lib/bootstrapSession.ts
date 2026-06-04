import {
  clearStoredSession,
  persistAuthResponse,
  readStoredSession,
  refreshSession,
  type AuthUser,
} from "../../../entities/auth/api/auth";
import { isJwtExpired } from "../../../shared/lib/jwt";

export const SESSION_EXPIRED_AUTH_MESSAGE =
  "Session expired. Please log in again." as const;

export type BootstrapPhase =
  | { kind: "guest"; authErrorMessage?: string }
  | {
      kind: "memberLoading";
      accessToken: string;
      user: AuthUser | null;
    };

export async function bootstrapSession(): Promise<BootstrapPhase> {
  const stored = readStoredSession();
  let accessToken = stored.accessToken;
  let user = stored.user;
  const refreshToken = stored.refreshToken;

  const accessExpired = isJwtExpired(accessToken);

  if (!accessToken && !refreshToken) {
    return { kind: "guest" };
  }

  if (accessExpired) {
    if (!refreshToken) {
      clearStoredSession();
      return {
        kind: "guest",
        authErrorMessage: SESSION_EXPIRED_AUTH_MESSAGE,
      };
    }

    try {
      const response = await refreshSession(refreshToken);
      persistAuthResponse(response);
      accessToken = response.accessToken;
      user = response.user;
    } catch {
      clearStoredSession();
      return {
        kind: "guest",
        authErrorMessage: SESSION_EXPIRED_AUTH_MESSAGE,
      };
    }
  }

  if (!accessToken || isJwtExpired(accessToken)) {
    clearStoredSession();
    return {
      kind: "guest",
      authErrorMessage: SESSION_EXPIRED_AUTH_MESSAGE,
    };
  }

  return {
    kind: "memberLoading",
    accessToken,
    user,
  };
}
