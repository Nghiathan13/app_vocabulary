import { useCallback, useEffect, useState } from "react";

import {
  AuthUser,
  getCurrentUser,
  loginAccount,
  registerAccount,
} from "../../entities/auth/api/auth";

const AUTH_TOKEN_KEY = "engvocab-access-token";

export function useAuthSession() {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(Boolean(accessToken));
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setIsCheckingAuth(false);
      return;
    }

    let isCurrent = true;

    setIsCheckingAuth(true);
    getCurrentUser(accessToken)
      .then((currentUser) => {
        if (isCurrent) {
          setUser(currentUser);
          setAuthError(null);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          console.warn("Failed to restore auth session:", error);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsCheckingAuth(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [accessToken]);

  const applyAuthResponse = useCallback(
    (token: string, currentUser: AuthUser) => {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      setAccessToken(token);
      setUser(currentUser);
      setAuthError(null);
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginAccount({ email, password });
      applyAuthResponse(response.accessToken, response.user);
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const response = await registerAccount({ email, password, name });
      applyAuthResponse(response.accessToken, response.user);
    },
    [applyAuthResponse],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  return {
    accessToken,
    user,
    isCheckingAuth,
    authError,
    setAuthError,
    login,
    register,
    logout,
  };
}
