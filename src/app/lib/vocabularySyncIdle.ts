import type { VocabularySyncStatus } from "../../shared/lib/syncStatus";

export interface VocabularySyncControls {
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
  pendingChangeCount: number;
  syncStatus: VocabularySyncStatus;
  refreshPendingChangeCount: () => Promise<number>;
  scheduleSync: () => void;
  syncNow: () => Promise<void>;
}

const noop = () => {};
const noopAsync = async () => {};
const noopRefreshCount = async () => 0;

/** Stable no-op sync API for web (no state, no effects). */
export const IDLE_VOCABULARY_SYNC: VocabularySyncControls = {
  isSyncing: false,
  syncError: null,
  lastSyncedAt: null,
  pendingChangeCount: 0,
  syncStatus: "idle",
  refreshPendingChangeCount: noopRefreshCount,
  scheduleSync: noop,
  syncNow: noopAsync,
};
