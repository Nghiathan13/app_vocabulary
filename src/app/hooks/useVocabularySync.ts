import { useCallback, useEffect, useRef, useState } from "react";

import {
  applyWordSyncResult,
  getWordSyncChanges,
} from "../../entities/word/api/words";
import { syncVocabulary } from "../../entities/sync/api/vocabularySync";
import { isDesktopMode } from "../../shared/config/appMode";
import type { VocabularySyncStatus } from "../../shared/lib/syncStatus";

const AUTO_SYNC_DELAY_MS = 2500;

export function useVocabularySync({
  accessToken,
  onSynced,
}: {
  accessToken: string | null;
  onSynced: () => Promise<void>;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [pendingChangeCount, setPendingChangeCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<VocabularySyncStatus>("idle");
  const debounceTimerRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);
  const syncQueuedRef = useRef(false);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const refreshPendingChangeCount = useCallback(async () => {
    if (!isDesktopMode) {
      setPendingChangeCount(0);
      return 0;
    }

    try {
      const changes = await getWordSyncChanges();
      const count = changes.length;
      setPendingChangeCount(count);
      setSyncStatus((currentStatus) => {
        if (currentStatus === "syncing" || currentStatus === "error") {
          return currentStatus;
        }

        return count > 0 ? "pending" : "idle";
      });
      return count;
    } catch (error) {
      console.warn("Failed to read pending sync changes:", error);
      return 0;
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!accessToken || !isDesktopMode) {
      return;
    }

    if (isSyncingRef.current) {
      syncQueuedRef.current = true;
      setSyncStatus("pending");
      return;
    }

    clearDebounceTimer();
    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncStatus("syncing");
    setSyncError(null);

    try {
      const changes = await getWordSyncChanges();
      setPendingChangeCount(changes.length);

      const result = await syncVocabulary(accessToken, changes);
      await applyWordSyncResult(result);
      setLastSyncedAt(result.syncedAt);
      setPendingChangeCount(0);
      setSyncStatus("idle");
      setSyncError(null);
      await onSynced();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      setSyncError(message);
      setSyncStatus("error");
      throw error;
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);

      if (syncQueuedRef.current) {
        syncQueuedRef.current = false;
        debounceTimerRef.current = window.setTimeout(() => {
          void syncNow().catch((error) => {
            console.warn("Queued sync failed:", error);
          });
        }, AUTO_SYNC_DELAY_MS);
      }
    }
  }, [accessToken, clearDebounceTimer, onSynced]);

  const scheduleSync = useCallback(() => {
    if (!accessToken || !isDesktopMode) {
      return;
    }

    void refreshPendingChangeCount();
    setSyncStatus((currentStatus) =>
      currentStatus === "syncing" ? "syncing" : "pending",
    );

    if (isSyncingRef.current) {
      syncQueuedRef.current = true;
      return;
    }

    clearDebounceTimer();
    debounceTimerRef.current = window.setTimeout(() => {
      void syncNow().catch((error) => {
        console.warn("Auto sync failed:", error);
      });
    }, AUTO_SYNC_DELAY_MS);
  }, [accessToken, clearDebounceTimer, refreshPendingChangeCount, syncNow]);

  useEffect(() => {
    if (!accessToken || !isDesktopMode) {
      setPendingChangeCount(0);
      setSyncStatus("idle");
      clearDebounceTimer();
      return;
    }

    void refreshPendingChangeCount();
  }, [accessToken, clearDebounceTimer, refreshPendingChangeCount]);

  useEffect(() => clearDebounceTimer, [clearDebounceTimer]);

  return {
    isSyncing,
    syncError,
    lastSyncedAt,
    pendingChangeCount,
    syncStatus,
    refreshPendingChangeCount,
    scheduleSync,
    syncNow,
  };
}
