import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { saveReturnPath } from "../../entities/auth/api/auth";
import { useAuthSession } from "../../features/account/hooks/useAuthSession";
import { isDesktopMode } from "../../shared/config/appMode";
import { ROUTES } from "../../shared/lib/routes";
import { useGlobalWords } from "./useGlobalWords";

type AppTheme = "dark" | "light";
const THEME_STORAGE_KEY = "engvocab-theme";

const getInitialTheme = (): AppTheme => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "dark" ? "dark" : "light";
};

type WordLoadMode = boolean | "authenticated";

export function useAppShell({ loadWords }: { loadWords: WordLoadMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const {
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
  } = useAuthSession();

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, [setAuthError]);

  const shouldLoadWords =
    loadWords === "authenticated" ? isLoggedIn : loadWords;

  const {
    globalWords,
    isLoading,
    loadError,
    fetchGlobalWords,
    clearGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordDeleted,
  } = useGlobalWords({ enabled: shouldLoadWords });

  const handleThemeToggle = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  const handleLoginClick = useCallback(() => {
    if (isDesktopMode) {
      setIsAccountModalOpen(true);
      return;
    }

    if (location.pathname !== ROUTES.login) {
      saveReturnPath(location.pathname);
    }

    navigate(ROUTES.login);
  }, [location.pathname, navigate]);

  const handleLogout = useCallback(async () => {
    await logout();

    if (!isDesktopMode) {
      clearGlobalWords();
    }
  }, [clearGlobalWords, logout]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!isDesktopMode && !isLoggedIn) {
      clearGlobalWords();
    }
  }, [clearGlobalWords, isLoggedIn]);

  return {
    navigate,
    theme,
    isAccountModalOpen,
    setIsAccountModalOpen,
    accessToken,
    user,
    sessionStatus,
    isCheckingAuth,
    isBootstrapping,
    isLoggedIn,
    authError,
    clearAuthError,
    login,
    register,
    logout: handleLogout,
    globalWords,
    isLoading,
    loadError,
    fetchGlobalWords,
    handleReviewUpdate,
    handleWordAdded,
    handleWordDeleted,
    handleThemeToggle,
    handleLoginClick,
  };
}

export type AppShellState = ReturnType<typeof useAppShell>;
