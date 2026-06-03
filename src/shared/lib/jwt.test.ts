import { describe, expect, it } from "vitest";

import { decodeJwtPayload, isJwtExpired } from "./jwt";

function createToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${body}.signature`;
}

describe("jwt", () => {
  it("decodes payload exp", () => {
    const token = createToken({ exp: 4_102_444_800 });

    expect(decodeJwtPayload(token)?.exp).toBe(4_102_444_800);
  });

  it("treats malformed tokens as expired", () => {
    expect(isJwtExpired("not-a-jwt")).toBe(true);
    expect(isJwtExpired(null)).toBe(true);
  });

  it("detects expired tokens with skew", () => {
    const expiredToken = createToken({ exp: Math.floor(Date.now() / 1000) - 120 });

    expect(isJwtExpired(expiredToken)).toBe(true);
  });

  it("detects valid tokens", () => {
    const validToken = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 });

    expect(isJwtExpired(validToken)).toBe(false);
  });
});
