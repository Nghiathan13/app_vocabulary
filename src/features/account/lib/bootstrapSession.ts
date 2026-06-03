import {
  clearStoredSession,
  persistAuthResponse,
  readStoredSession,
  refreshSession,
  type AuthUser,
} from "../../../entities/auth/api/auth";
import { isJwtExpired } from "../../../shared/lib/jwt";

export type BootstrapPhase =
  | { kind: "guest" }
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
      return { kind: "guest" };
    }

    try {
      const response = await refreshSession(refreshToken);
      persistAuthResponse(response);
      accessToken = response.accessToken;
      user = response.user;
    } catch {
      clearStoredSession();
      return { kind: "guest" };
    }
  }

  if (!accessToken || isJwtExpired(accessToken)) {
    clearStoredSession();
    return { kind: "guest" };
  }

  return {
    kind: "memberLoading",
    accessToken,
    user,
  };
}
