import { API_BASE_URL } from "../../../shared/config/appMode";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
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

export async function getCurrentUser(token: string): Promise<AuthUser> {
  return await request<AuthUser>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
