import { describe, expect, it } from "vitest";
import {
  allowedOrigin,
  deletionAuditHash,
  hasRecentAuthentication,
  validConfirmation,
} from "../supabase/functions/_shared/accountDeletion";

describe("account deletion backend guards", () => {
  it("accepts only an exact configured browser origin", () => {
    const configured = "https://skillup.example, http://localhost:5173";
    expect(allowedOrigin("https://skillup.example", configured)).toBe(true);
    expect(allowedOrigin("https://evil.example", configured)).toBe(false);
    expect(allowedOrigin("", configured)).toBe(true);
  });

  it("requires the exact destructive confirmation", () => {
    const acknowledged = {
      confirmation: "EXCLUIR",
      acknowledge_irreversible: true,
      acknowledge_academic_records: true,
    };
    expect(validConfirmation(acknowledged)).toBe(true);
    expect(
      validConfirmation({ ...acknowledged, confirmation: "excluir" }),
    ).toBe(false);
    expect(
      validConfirmation({
        ...acknowledged,
        acknowledge_academic_records: false,
      }),
    ).toBe(false);
    expect(validConfirmation({ ...acknowledged, user_id: "other" })).toBe(true);
    expect(validConfirmation(null)).toBe(false);
  });

  it("accepts authentication up to ten minutes old", () => {
    const now = Date.parse("2026-11-10T12:00:00.000Z");
    expect(hasRecentAuthentication("2026-11-10T11:50:00.000Z", now)).toBe(true);
    expect(hasRecentAuthentication("2026-11-10T11:49:59.999Z", now)).toBe(
      false,
    );
    expect(hasRecentAuthentication(undefined, now)).toBe(false);
    expect(hasRecentAuthentication("2026-11-10T12:01:00.000Z", now)).toBe(
      false,
    );
  });

  it("creates a stable SHA-256 audit identifier without retaining the UUID", async () => {
    const userId = "00000000-0000-4000-8000-000000000001";
    const hash = await deletionAuditHash(userId);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(await deletionAuditHash(userId));
    expect(hash).not.toContain("00000000");
  });
});
