import "./AuthSessionNotice.css";

interface AuthSessionNoticeProps {
  message: string;
  onDismiss?: () => void;
}

export default function AuthSessionNotice({
  message,
  onDismiss,
}: AuthSessionNoticeProps) {
  return (
    <div className="auth-session-notice" role="alert">
      <p className="auth-session-notice-message">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          className="auth-session-notice-dismiss"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
