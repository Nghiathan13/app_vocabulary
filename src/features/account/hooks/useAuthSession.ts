import { useCallback, useEffect, useRef, useState } from "react";

import {
  ApiUnauthorizedError,
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
import {
  bootstrapSession,
  SESSION_EXPIRED_AUTH_MESSAGE,
} from "../lib/bootstrapSession";

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
  const isLoggingOutRef = useRef(false);

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
    if (isWebMode) {
      useWordStore.setState({
        globalWords: [],
        isLoading: false,
        loadError: false,
      });
    }
  }, []);

  const logout = useCallback(
    async (options?: { authErrorMessage?: string | null }) => {
      if (isLoggingOutRef.current) {
        return;
      }

      isLoggingOutRef.current = true;

      try {
        const refreshToken = readStoredSession().refreshToken;

        if (refreshToken) {
          try {
            await logoutSession(refreshToken);
          } catch {
            // Ignore logout API errors and clear local session anyway.
          }
        }

        clearSession();

        if (options?.authErrorMessage !== undefined) {
          setAuthError(options.authErrorMessage);
        } else {
          setAuthError(null);
        }
      } finally {
        isLoggingOutRef.current = false;
      }
    },
    [clearSession],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout({ authErrorMessage: SESSION_EXPIRED_AUTH_MESSAGE });
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
        setAuthError(phase.authErrorMessage ?? null);
        setIsBootstrapping(false);
        return;
      }

      setAccessToken(phase.accessToken);
      setUser(phase.user);
      setSessionStatus("memberLoading");

      try {
        const [currentUser, words] = await Promise.all([
          getCurrentUser(phase.accessToken),
          listWords(phase.accessToken),
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

        if (error instanceof ApiUnauthorizedError) {
          // `unauthorizedHandler` already called `logout({ authErrorMessage })`.
        } else {
          clearSession();
          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : SESSION_EXPIRED_AUTH_MESSAGE;
          setAuthError(message);
        }
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

      try {
        const words = await listWords(response.accessToken);
        useWordStore.setState({
          globalWords: words,
          isLoading: false,
          loadError: false,
        });
        setSessionStatus("member");
      } catch (error) {
        if (error instanceof ApiUnauthorizedError) {
          throw error;
        }

        clearSession();
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Could not load vocabulary. Please try again.";
        throw new Error(message);
      }
    },
    [clearSession],
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
