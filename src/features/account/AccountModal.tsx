import { AuthUser } from "../../entities/auth/api/auth";
import { VocabularySyncStatus } from "../../app/hooks/useVocabularySync";
import { Button } from "../../shared/ui/Button/Button";
import {
  formatLastSyncedTime,
  formatPendingChangesDetail,
  getSyncStatusLabel,
  isOfflineSyncStatus,
} from "../../shared/lib/syncStatus";
import Modal from "../../shared/ui/Modal/Modal";
import AccountAuthForm from "./AccountAuthForm";
import "./AccountModal.css";

interface AccountModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  isCheckingAuth: boolean;
  showSyncAction: boolean;
  isSyncing: boolean;
  syncStatus: VocabularySyncStatus;
  pendingChangeCount: number;
  lastSyncedAt: string | null;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string) => Promise<void>;
  onLogout: () => void;
  onSyncNow: () => Promise<void>;
}

export default function AccountModal({
  isOpen,
  user,
  isCheckingAuth,
  showSyncAction,
  isSyncing,
  syncStatus,
  pendingChangeCount,
  lastSyncedAt,
  onClose,
  onLogin,
  onRegister,
  onLogout,
  onSyncNow,
}: AccountModalProps) {
  const syncStatusLabel = getSyncStatusLabel({
    isSyncing,
    syncStatus,
    pendingChangeCount,
    lastSyncedAt,
  });
  const pendingDetail = formatPendingChangesDetail(pendingChangeCount);
  const lastSyncedDetail = formatLastSyncedTime(lastSyncedAt);
  const isOfflineStatus = isOfflineSyncStatus(syncStatus);
  const handleSyncNow = () => {
    void onSyncNow().catch((error) => {
      console.warn("Manual sync failed:", error);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="account-modal"
      headerStart={<h2 className="account-title">Account</h2>}
      showCloseButton
      closeButtonDisabled={isSyncing}
    >
      {user ? (
        <div className="account-panel">
          <div>
            <p className="account-label">Signed in as</p>
            <p className="account-user-email">{user.email}</p>
          </div>

          {showSyncAction ? (
            <div className="account-sync-block">
              <p className="account-label">Sync status</p>
              <p
                className={`account-sync-status-label${isOfflineStatus ? " account-sync-status-label--offline" : ""}`}
              >
                {syncStatusLabel}
              </p>
              {pendingDetail ? (
                <p className="account-sync-detail">{pendingDetail}</p>
              ) : null}
              {lastSyncedDetail ? (
                <p className="account-sync-detail">
                  Last synced: {lastSyncedDetail}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="account-actions">
            {showSyncAction ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleSyncNow}
                disabled={isSyncing}
              >
                {isSyncing ? "Syncing..." : "Sync now"}
              </Button>
            ) : null}
            <Button type="button" onClick={onLogout} disabled={isSyncing}>
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <AccountAuthForm
          isCheckingAuth={isCheckingAuth}
          onLogin={onLogin}
          onRegister={onRegister}
          onSuccess={onClose}
        />
      )}
    </Modal>
  );
}
