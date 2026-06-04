import { Navigate, useNavigate } from "react-router-dom";

import { consumeReturnPath } from "../../../entities/auth/api/auth";
import { ROUTES } from "../../../shared/lib/routes";
import AccountAuthForm from "../components/AccountAuthForm";
import AuthSessionNotice from "../components/AuthSessionNotice";
import "./WebLoginPage.css";

interface WebLoginPageProps {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  authError?: string | null;
  onDismissAuthError?: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string) => Promise<void>;
}

export default function WebLoginPage({
  isAuthenticated,
  isCheckingAuth,
  authError,
  onDismissAuthError,
  onLogin,
  onRegister,
}: WebLoginPageProps) {
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return (
    <div className="web-account-gate">
      <h1>EngVocab Account</h1>
      <p>Log in or register to manage your vocabulary online.</p>
      {authError ? (
        <AuthSessionNotice
          message={authError}
          onDismiss={onDismissAuthError}
        />
      ) : null}
      <AccountAuthForm
        isCheckingAuth={isCheckingAuth}
        onLogin={onLogin}
        onRegister={onRegister}
        onSuccess={() =>
          navigate(consumeReturnPath(ROUTES.home), { replace: true })
        }
      />
    </div>
  );
}
