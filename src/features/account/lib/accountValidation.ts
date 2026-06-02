export type AuthMode = "login" | "register";

export interface AccountValidationInput {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getAccountValidationError({
  mode,
  email,
  password,
  name,
}: AccountValidationInput): string | null {
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
