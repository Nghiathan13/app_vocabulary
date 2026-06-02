import { FormEvent, useState } from "react";

import { AuthUser } from "../../entities/auth/api/auth";
import { Button } from "../../shared/ui/Button/Button";
import Modal from "../../shared/ui/Modal/Modal";
import "./SettingsModal.css";

interface SettingsModalProps {
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

export default function SettingsModal({
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
}: SettingsModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, name);
      }
      setPassword("");
      setName("");
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Auth failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="settings-modal"
      headerStart={<h2 className="settings-title">Account</h2>}
      showCloseButton
      closeButtonDisabled={isSubmitting || isSyncing}
    >
      {user ? (
        <div className="settings-account">
          <div>
            <p className="settings-label">Signed in as</p>
            <p className="settings-user-email">{user.email}</p>
          </div>

          <div className="settings-sync-status">
            <p className="settings-label">Last sync</p>
            <p>{lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Not synced yet"}</p>
          </div>

          {syncError ? <p className="settings-error">{syncError}</p> : null}

          <div className="settings-actions">
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
        <form className="settings-auth-form" onSubmit={handleSubmit}>
          <div className="settings-mode-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {mode === "register" ? (
            <label>
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </label>

          {submitError ? <p className="settings-error">{submitError}</p> : null}
          {isCheckingAuth ? <p className="settings-hint">Checking session...</p> : null}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSubmitting || isCheckingAuth}
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Register"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
