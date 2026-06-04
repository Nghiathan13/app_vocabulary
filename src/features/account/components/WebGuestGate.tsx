import AuthSessionNotice from "./AuthSessionNotice";
import "./WebGuestGate.css";

interface WebGuestGateProps {
  authError?: string | null;
  onDismissAuthError?: () => void;
}

export default function WebGuestGate({
  authError,
  onDismissAuthError,
}: WebGuestGateProps) {
  return (
    <div className="web-guest-gate">
      {authError ? (
        <AuthSessionNotice message={authError} onDismiss={onDismissAuthError} />
      ) : null}
      <p className="web-guest-gate-title">
        Sign in to view and manage your vocabulary.
      </p>
      <p className="web-guest-gate-hint">Use the Log in button above.</p>
    </div>
  );
}
