import { FormEvent, useState } from "react";

import { Button } from "../../../shared/ui/Button/Button";
import "./AccountAuthForm.css";

type AuthMode = "login" | "register";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccountAuthFormProps {
  initialMode?: AuthMode;
  isCheckingAuth: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string) => Promise<void>;
  onSuccess?: () => void;
}

function getValidationError(
  mode: AuthMode,
  email: string,
  password: string,
  name: string,
): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Enter a valid email.";
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return "Enter a valid email.";
  }

  if (!password) {
    return "Enter your password.";
  }

  if (password.length > 128) {
    return "Password must be 128 characters or fewer.";
  }

  if (mode === "register") {
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (name.trim().length > 80) {
      return "Name must be 80 characters or fewer.";
    }
  }

  return null;
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

  const validationError = getValidationError(mode, email, password, name);
  const isFormDisabled = isSubmitting || isCheckingAuth || validationError !== null;

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const clientError = getValidationError(mode, email, password, name);

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
        <label>
          <span>Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            maxLength={80}
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
        />
      </label>

      <label>
        <span>Password</span>
        <input
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
