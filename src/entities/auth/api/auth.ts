import { API_BASE_URL } from "../../../shared/config/appMode";
import { writeStoredSession, type StoredSession } from "../lib/sessionStorage";

export type { StoredSession };
export {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_USER_KEY,
  AUTH_RETURN_PATH_KEY,
  clearStoredSession,
  consumeReturnPath,
  readStoredSession,
  saveReturnPath,
  writeStoredSession,
} from "../lib/sessionStorage";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
}

function parseApiError(
  errorBody: unknown,
  status: number,
  path: string,
): string {
  if (status === 401 && path === "/auth/login") {
    return "Invalid email or password";
  }

  if (errorBody && typeof errorBody === "object" && "message" in errorBody) {
    const { message } = errorBody as { message?: unknown };

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const parts = message
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);

      if (parts.length > 0) {
        return parts.join(". ");
      }
    }
  }

  return "Request failed";
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot connect to server");
  }

  if (response.status === 401 && unauthorizedHandler) {
    unauthorizedHandler();
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(parseApiError(errorBody, response.status, path));
  }

  return await response.json();
}

export async function registerAccount({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  return await request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function loginAccount({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshSession(
  refreshToken: string,
): Promise<AuthResponse> {
  return await request<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutSession(refreshToken: string): Promise<void> {
  await request<{ success: boolean }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  return await request<AuthUser>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function persistAuthResponse(response: AuthResponse) {
  writeStoredSession({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: response.user,
  });
}
