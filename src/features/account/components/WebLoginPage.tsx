import { Navigate, useNavigate } from "react-router-dom";

import { ROUTES } from "../../../shared/lib/routes";
import AccountAuthForm from "./AccountAuthForm";
import "./WebLoginPage.css";

interface WebLoginPageProps {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string) => Promise<void>;
}

export default function WebLoginPage({
  isAuthenticated,
  isCheckingAuth,
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
      <AccountAuthForm
        isCheckingAuth={isCheckingAuth}
        onLogin={onLogin}
        onRegister={onRegister}
        onSuccess={() => navigate(ROUTES.home, { replace: true })}
      />
    </div>
  );
}
