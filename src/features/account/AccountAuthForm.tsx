import { FormEvent, useState } from "react";

import { Button } from "../../shared/ui/Button/Button";
import "./AccountAuthForm.css";

type AuthMode = "login" | "register";

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

      {submitError ? <p className="account-auth-error">{submitError}</p> : null}
      {isCheckingAuth ? (
        <p className="account-auth-hint">Checking session...</p>
      ) : null}

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
  );
}
