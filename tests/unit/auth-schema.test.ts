import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "../../src/lib/auth/schema";
describe("authentication validation", () => {
  it("rejects invalid credentials", () =>
    expect(
      loginSchema.safeParse({ email: "x", password: "short" }).success,
    ).toBe(false));
  it("accepts a signup", () =>
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "password123",
        displayName: "User",
      }).success,
    ).toBe(true));
});
