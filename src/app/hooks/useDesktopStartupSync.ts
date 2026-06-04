import { useEffect, useRef } from "react";

export function useDesktopStartupSync({
  accessToken,
  user,
  isLoading,
  isCheckingAuth,
  syncNow,
}: {
  accessToken: string | null;
  user: unknown;
  isLoading: boolean;
  isCheckingAuth: boolean;
  syncNow: () => Promise<void>;
}) {
  const startupSyncAccessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      startupSyncAccessTokenRef.current === accessToken ||
      isLoading ||
      isCheckingAuth ||
      !user ||
      !accessToken
    ) {
      return;
    }

    startupSyncAccessTokenRef.current = accessToken;
    void syncNow().catch((error) => {
      console.warn("Startup sync failed:", error);
    });
  }, [accessToken, isCheckingAuth, isLoading, syncNow, user]);
}
