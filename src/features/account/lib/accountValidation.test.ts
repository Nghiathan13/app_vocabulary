import { describe, expect, it } from "vitest";

import { getAccountValidationError } from "./accountValidation";

describe("getAccountValidationError", () => {
  it("returns message for empty email", () => {
    expect(
      getAccountValidationError({
        mode: "login",
        email: "",
        password: "secret",
        name: "",
      }),
    ).toBe("Enter a valid email.");
  });

  it("returns message for invalid email", () => {
    expect(
      getAccountValidationError({
        mode: "login",
        email: "not-an-email",
        password: "secret",
        name: "",
      }),
    ).toBe("Enter a valid email.");
  });

  it("returns message for empty password", () => {
    expect(
      getAccountValidationError({
        mode: "login",
        email: "user@example.com",
        password: "",
        name: "",
      }),
    ).toBe("Enter your password.");
  });

  it("allows short password in login mode", () => {
    expect(
      getAccountValidationError({
        mode: "login",
        email: "user@example.com",
        password: "short",
        name: "",
      }),
    ).toBeNull();
  });

  it("returns min length message for register short password", () => {
    expect(
      getAccountValidationError({
        mode: "register",
        email: "user@example.com",
        password: "short",
        name: "",
      }),
    ).toBe("Password must be at least 8 characters.");
  });

  it("returns max length message for long password", () => {
    expect(
      getAccountValidationError({
        mode: "login",
        email: "user@example.com",
        password: "a".repeat(129),
        name: "",
      }),
    ).toBe("Password must be 128 characters or fewer.");
  });

  it("returns name max message in register mode", () => {
    expect(
      getAccountValidationError({
        mode: "register",
        email: "user@example.com",
        password: "password1",
        name: "a".repeat(81),
      }),
    ).toBe("Name must be 80 characters or fewer.");
  });

  it("returns null for valid register input", () => {
    expect(
      getAccountValidationError({
        mode: "register",
        email: "user@example.com",
        password: "password1",
        name: "Alex",
      }),
    ).toBeNull();
  });

  it("returns null for valid login input", () => {
    expect(
      getAccountValidationError({
        mode: "login",
        email: "user@example.com",
        password: "short",
        name: "",
      }),
    ).toBeNull();
  });

  it("trims email before validation", () => {
    expect(
      getAccountValidationError({
        mode: "login",
        email: "  user@example.com  ",
        password: "secret",
        name: "",
      }),
    ).toBeNull();
  });
});
