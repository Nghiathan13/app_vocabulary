import { useCallback, useEffect, useRef, useState } from "react";

import {
  AuthUser,
  clearStoredSession,
  getCurrentUser,
  loginAccount,
  logoutSession,
  persistAuthResponse,
  readStoredSession,
  registerAccount,
  setUnauthorizedHandler,
} from "../../../entities/auth/api/auth";
import { listWords } from "../../../entities/word/api/words";
import { useWordStore } from "../../../entities/word/model/store";
import { isWebMode } from "../../../shared/config/appMode";
import { bootstrapSession } from "../lib/bootstrapSession";

export type WebSessionStatus = "guest" | "memberLoading" | "member";

export function useAuthSession() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionStatus, setSessionStatus] = useState<WebSessionStatus>(() =>
    isWebMode ? "guest" : "member",
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(isWebMode);
  const bootstrapStartedRef = useRef(false);

  const applyAuthResponse = useCallback((response: Awaited<ReturnType<typeof loginAccount>>) => {
    persistAuthResponse(response);
    setAccessToken(response.accessToken);
    setUser(response.user);
    setAuthError(null);
    setSessionStatus("member");
  }, []);

  const clearSession = useCallback(() => {
    clearStoredSession();
    setAccessToken(null);
    setUser(null);
    setSessionStatus("guest");
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = readStoredSession().refreshToken;

    if (refreshToken) {
      try {
        await logoutSession(refreshToken);
      } catch {
        // Ignore logout API errors and clear local session anyway.
      }
    }

    clearSession();
    setAuthError(null);
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
      setAuthError("Session expired. Please log in again.");
    });

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!isWebMode || bootstrapStartedRef.current) {
      return;
    }

    bootstrapStartedRef.current = true;
    let isCurrent = true;

    const runBootstrap = async () => {
      const phase = await bootstrapSession();

      if (!isCurrent) {
        return;
      }

      if (phase.kind === "guest") {
        clearSession();
        setIsBootstrapping(false);
        return;
      }

      setAccessToken(phase.accessToken);
      setUser(phase.user);
      setSessionStatus("memberLoading");

      try {
        const [currentUser, words] = await Promise.all([
          getCurrentUser(phase.accessToken),
          listWords(),
        ]);

        if (!isCurrent) {
          return;
        }

        const stored = readStoredSession();

        if (stored.refreshToken) {
          persistAuthResponse({
            accessToken: phase.accessToken,
            refreshToken: stored.refreshToken,
            user: currentUser,
          });
        }

        setUser(currentUser);
        setSessionStatus("member");
        setAuthError(null);

        useWordStore.setState({
          globalWords: words,
          isLoading: false,
          loadError: false,
        });
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        console.warn("Failed to restore web session:", error);
        clearSession();
        setAuthError("Session expired. Please log in again.");
      } finally {
        if (isCurrent) {
          setIsBootstrapping(false);
        }
      }
    };

    void runBootstrap();

    return () => {
      isCurrent = false;
    };
  }, [clearSession]);

  const completeWebLogin = useCallback(
    async (response: Awaited<ReturnType<typeof loginAccount>>) => {
      persistAuthResponse(response);
      setAccessToken(response.accessToken);
      setUser(response.user);
      setAuthError(null);
      setSessionStatus("memberLoading");

      const words = await listWords();
      useWordStore.setState({
        globalWords: words,
        isLoading: false,
        loadError: false,
      });
      setSessionStatus("member");
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginAccount({ email, password });

      if (isWebMode) {
        await completeWebLogin(response);
        return;
      }

      applyAuthResponse(response);
    },
    [applyAuthResponse, completeWebLogin],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const response = await registerAccount({ email, password, name });

      if (isWebMode) {
        await completeWebLogin(response);
        return;
      }

      applyAuthResponse(response);
    },
    [applyAuthResponse, completeWebLogin],
  );

  const isCheckingAuth = isWebMode && (isBootstrapping || sessionStatus === "memberLoading");
  const isLoggedIn = isWebMode ? sessionStatus === "member" : Boolean(user);

  return {
    accessToken,
    user,
    sessionStatus,
    isCheckingAuth,
    isBootstrapping,
    isLoggedIn,
    authError,
    setAuthError,
    login,
    register,
    logout,
  };
}
