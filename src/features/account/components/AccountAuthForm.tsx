import { FormEvent, useState } from "react";

import { Button } from "../../../shared/ui/Button/Button";
import {
  AuthMode,
  getAccountValidationError,
} from "../lib/accountValidation";
import "./AccountAuthForm.css";

interface AccountAuthFormProps {
  initialMode?: AuthMode;
  isCheckingAuth: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string) => Promise<void>;
  onSuccess?: () => void;
}

export default function AccountAuthForm({
  initialMode = "login",
  isCheckingAuth,
  onLogin,
  onRegister,
  onSuccess,
}: AccountAuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationError = getAccountValidationError({
    mode,
    email,
    password,
    name,
  });
  const isFormDisabled = isSubmitting || isCheckingAuth || validationError !== null;

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const clientError = getAccountValidationError({
      mode,
      email,
      password,
      name,
    });

    if (clientError) {
      setSubmitError(clientError);
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (mode === "login") {
        await onLogin(trimmedEmail, password);
      } else {
        await onRegister(
          trimmedEmail,
          password,
          trimmedName ? trimmedName : undefined,
        );
      }

      setPassword("");
      setName("");
      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Auth failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="account-auth-form" onSubmit={handleSubmit}>
      <div className="account-auth-mode-tabs">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => handleModeChange("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === "register" ? "active" : ""}
          onClick={() => handleModeChange("register")}
        >
          Register
        </button>
      </div>

      {mode === "register" ? (
        <label htmlFor="auth-name">
          <span>Name</span>
          <input
            id="auth-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            maxLength={80}
          />
        </label>
      ) : null}

      <label htmlFor="auth-email">
        <span>Email</span>
        <input
          id="auth-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </label>

      <label htmlFor="auth-password">
        <span>Password</span>
        <input
          id="auth-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          maxLength={128}
        />
      </label>

      {submitError ? <p className="account-auth-error">{submitError}</p> : null}
      {isCheckingAuth ? (
        <p className="account-auth-hint">Checking session...</p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={isFormDisabled}
      >
        {isSubmitting
          ? "Please wait..."
          : mode === "login"
            ? "Login"
            : "Register"}
      </Button>
    </form>
  );
}
