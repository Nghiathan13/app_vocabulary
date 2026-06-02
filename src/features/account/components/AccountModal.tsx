import { AuthUser } from "../../../entities/auth/api/auth";
import type { VocabularySyncStatus } from "../../../shared/lib/syncStatus";
import { Button } from "../../../shared/ui/Button/Button";
import Modal from "../../../shared/ui/Modal/Modal";
import SyncStatusDisplay from "../../../shared/ui/SyncStatusDisplay/SyncStatusDisplay";
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
            <SyncStatusDisplay
              isSyncing={isSyncing}
              syncStatus={syncStatus}
              pendingChangeCount={pendingChangeCount}
              lastSyncedAt={lastSyncedAt}
              className="account-sync-block"
              labelClassName="account-sync-status-label"
              detailClassName="account-sync-detail"
              offlineClassName="account-sync-status-label--offline"
              headingClassName="account-label"
              showHeading
              headingText="Sync status"
            />
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
