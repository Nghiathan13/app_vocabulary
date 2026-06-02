import { AuthUser } from "../../entities/auth/api/auth";
import { Button } from "../../shared/ui/Button/Button";
import Modal from "../../shared/ui/Modal/Modal";
import AccountAuthForm from "./AccountAuthForm";
import "./AccountModal.css";

interface AccountModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  isCheckingAuth: boolean;
  isSyncing: boolean;
  syncError: string | null;
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
  isSyncing,
  syncError,
  lastSyncedAt,
  onClose,
  onLogin,
  onRegister,
  onLogout,
  onSyncNow,
}: AccountModalProps) {
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

          <div className="account-sync-status">
            <p className="account-label">Last sync</p>
            <p>{lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Not synced yet"}</p>
          </div>

          {syncError ? <p className="account-error">{syncError}</p> : null}

          <div className="account-actions">
            <Button
              type="button"
              variant="primary"
              onClick={() => void onSyncNow()}
              disabled={isSyncing}
            >
              {isSyncing ? "Syncing..." : "Sync now"}
            </Button>
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
