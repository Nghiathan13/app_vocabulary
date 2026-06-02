import {
  formatLastSyncedTime,
  formatPendingChangesDetail,
  getSyncStatusLabel,
  isOfflineSyncStatus,
  type VocabularySyncStatus,
} from "../../lib/syncStatus";
import "./SyncStatusDisplay.css";

export interface SyncStatusDisplayProps {
  isSyncing: boolean;
  syncStatus: VocabularySyncStatus;
  pendingChangeCount: number;
  lastSyncedAt: string | null;
  className?: string;
  labelClassName?: string;
  detailClassName?: string;
  offlineClassName?: string;
  headingClassName?: string;
  labelAs?: "p" | "div";
  showHeading?: boolean;
  headingText?: string;
}

export default function SyncStatusDisplay({
  isSyncing,
  syncStatus,
  pendingChangeCount,
  lastSyncedAt,
  className,
  labelClassName = "",
  detailClassName = "",
  offlineClassName = "",
  headingClassName = "",
  labelAs = "p",
  showHeading = false,
  headingText = "Sync status",
}: SyncStatusDisplayProps) {
  const syncStatusLabel = getSyncStatusLabel({
    isSyncing,
    syncStatus,
    pendingChangeCount,
    lastSyncedAt,
  });
  const pendingDetail = formatPendingChangesDetail(pendingChangeCount);
  const lastSyncedDetail = formatLastSyncedTime(lastSyncedAt);
  const isOfflineStatus = isOfflineSyncStatus(syncStatus);

  const labelClass = [
    labelClassName,
    isOfflineStatus && offlineClassName ? offlineClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  const LabelTag = labelAs;

  return (
    <div className={className}>
      {showHeading ? (
        <p className={headingClassName}>{headingText}</p>
      ) : null}
      <LabelTag className={labelClass || undefined}>{syncStatusLabel}</LabelTag>
      {pendingDetail ? (
        <p className={detailClassName || undefined}>{pendingDetail}</p>
      ) : null}
      {lastSyncedDetail ? (
        <p className={detailClassName || undefined}>
          Last synced: {lastSyncedDetail}
        </p>
      ) : null}
    </div>
  );
}
