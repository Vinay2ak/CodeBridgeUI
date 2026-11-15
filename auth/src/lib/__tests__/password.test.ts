import { describe, it, expect } from "vitest";
import { strength } from "../../lib/password";

describe("strength()", () => {
  it("empty string -> weak", () => {
    expect(strength("", "user@example.com")).toBe("weak");
  });

  it("'aaaaaaaaaaaaaa' (14 a's, < 5 unique) -> weak", () => {
    expect(strength("aaaaaaaaaaaaaa", "user@example.com")).toBe("weak");
  });

  it("'password1234' -> weak (common)", () => {
    expect(strength("password1234", "user@example.com")).toBe("weak");
  });

  it("email name in password -> weak", () => {
    expect(strength("testpassword1234", "test@example.com")).toBe("weak");
  });

  it("11 chars passing other rules -> weak (length)", () => {
    // 11 chars, not common, 5+ unique, no email match
    expect(strength("MyPass12ab!", "user@example.com")).toBe("weak");
  });

  it("'MyS3cur3Pass!!' (16 chars, all rules pass) -> strong", () => {
    // 16 chars: MyS3cur3Pass!!Ab
    expect(strength("MyS3cur3Pass!!Ab", "user@example.com")).toBe("strong");
  });

  it("'MyPass12abc' (12 chars, all rules pass) -> okay", () => {
    expect(strength("MyPass12abc!", "user@example.com")).toBe("okay");
  });
});
