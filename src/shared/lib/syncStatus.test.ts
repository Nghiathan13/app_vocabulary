import { describe, expect, it } from "vitest";

import {
  formatLastSyncedTime,
  formatPendingChangesDetail,
  getSyncStatusLabel,
} from "./syncStatus";

describe("getSyncStatusLabel", () => {
  it("returns Syncing when active", () => {
    expect(
      getSyncStatusLabel({
        isSyncing: true,
        syncStatus: "idle",
        pendingChangeCount: 0,
        lastSyncedAt: null,
      }),
    ).toBe("Syncing...");
  });

  it("returns offline label on error", () => {
    expect(
      getSyncStatusLabel({
        isSyncing: false,
        syncStatus: "error",
        pendingChangeCount: 2,
        lastSyncedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe("Offline changes saved");
  });

  it("returns pending label when changes exist", () => {
    expect(
      getSyncStatusLabel({
        isSyncing: false,
        syncStatus: "idle",
        pendingChangeCount: 3,
        lastSyncedAt: null,
      }),
    ).toBe("Pending changes");
  });

  it("returns Synced after successful sync", () => {
    expect(
      getSyncStatusLabel({
        isSyncing: false,
        syncStatus: "idle",
        pendingChangeCount: 0,
        lastSyncedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe("Synced");
  });

  it("returns Not synced yet before first sync", () => {
    expect(
      getSyncStatusLabel({
        isSyncing: false,
        syncStatus: "idle",
        pendingChangeCount: 0,
        lastSyncedAt: null,
      }),
    ).toBe("Not synced yet");
  });
});

describe("formatPendingChangesDetail", () => {
  it("formats singular and plural counts", () => {
    expect(formatPendingChangesDetail(0)).toBeNull();
    expect(formatPendingChangesDetail(1)).toBe("1 pending change");
    expect(formatPendingChangesDetail(3)).toBe("3 pending changes");
  });
});

describe("formatLastSyncedTime", () => {
  it("returns null when missing", () => {
    expect(formatLastSyncedTime(null)).toBeNull();
  });

  it("formats local time", () => {
    const formatted = formatLastSyncedTime("2026-06-02T14:32:00.000Z");
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });
});
