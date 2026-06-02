import type { VocabularySyncStatus } from "../../app/hooks/useVocabularySync";

export interface SyncStatusInput {
  isSyncing: boolean;
  syncStatus: VocabularySyncStatus;
  pendingChangeCount: number;
  lastSyncedAt: string | null;
}

export function getSyncStatusLabel({
  isSyncing,
  syncStatus,
  pendingChangeCount,
  lastSyncedAt,
}: SyncStatusInput): string {
  if (isSyncing || syncStatus === "syncing") {
    return "Syncing...";
  }

  if (syncStatus === "error") {
    return "Offline changes saved";
  }

  if (pendingChangeCount > 0 || syncStatus === "pending") {
    return "Pending changes";
  }

  if (lastSyncedAt) {
    return "Synced";
  }

  return "Not synced yet";
}

export function formatLastSyncedTime(lastSyncedAt: string | null): string | null {
  if (!lastSyncedAt) {
    return null;
  }

  return new Date(lastSyncedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPendingChangesDetail(
  pendingChangeCount: number,
): string | null {
  if (pendingChangeCount <= 0) {
    return null;
  }

  return pendingChangeCount === 1
    ? "1 pending change"
    : `${pendingChangeCount} pending changes`;
}

export function isOfflineSyncStatus(syncStatus: VocabularySyncStatus): boolean {
  return syncStatus === "error";
}
