import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_USER_KEY,
} from "../../../entities/auth/lib/sessionStorage";

const { refreshSessionMock } = vi.hoisted(() => ({
  refreshSessionMock: vi.fn(),
}));

vi.mock("../../../entities/auth/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../entities/auth/api/auth")>();

  return {
    ...actual,
    refreshSession: refreshSessionMock,
  };
});

import { bootstrapSession } from "./bootstrapSession";

const storage = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
};

function createToken(exp: number) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const body = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${body}.signature`;
}

describe("bootstrapSession", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    storage.clear();
    refreshSessionMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns guest when no tokens exist", async () => {
    await expect(bootstrapSession()).resolves.toEqual({ kind: "guest" });
  });

  it("returns memberLoading when access token is valid", async () => {
    const accessToken = createToken(Math.floor(Date.now() / 1000) + 3600);
    localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: "1", email: "a@b.c", name: null }));

    const result = await bootstrapSession();

    expect(result).toEqual({
      kind: "memberLoading",
      accessToken,
      user: { id: "1", email: "a@b.c", name: null },
    });
  });

  it("refreshes when access is expired and refresh token exists", async () => {
    const expiredAccess = createToken(Math.floor(Date.now() / 1000) - 60);
    const newAccess = createToken(Math.floor(Date.now() / 1000) + 3600);

    localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, expiredAccess);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, "opaque-refresh-token");

    refreshSessionMock.mockResolvedValue({
      accessToken: newAccess,
      refreshToken: "new-refresh",
      user: { id: "1", email: "a@b.c", name: null },
    });

    const result = await bootstrapSession();

    expect(refreshSessionMock).toHaveBeenCalledWith("opaque-refresh-token");
    expect(result).toEqual({
      kind: "memberLoading",
      accessToken: newAccess,
      user: { id: "1", email: "a@b.c", name: null },
    });
  });

  it("returns guest when refresh fails", async () => {
    const expiredAccess = createToken(Math.floor(Date.now() / 1000) - 60);

    localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, expiredAccess);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, "opaque-refresh-token");
    refreshSessionMock.mockRejectedValue(new Error("invalid"));

    await expect(bootstrapSession()).resolves.toEqual({ kind: "guest" });
    expect(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)).toBeNull();
  });
});
