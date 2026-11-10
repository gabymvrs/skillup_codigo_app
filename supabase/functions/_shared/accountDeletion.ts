export const RECENT_AUTHENTICATION_SECONDS = 10 * 60;

export function allowedOrigin(origin: string, configured: string) {
  if (!origin) return true;
  return configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(origin);
}

export function validConfirmation(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).confirmation === "EXCLUIR" &&
    (value as Record<string, unknown>).acknowledge_irreversible === true &&
    (value as Record<string, unknown>).acknowledge_academic_records === true
  );
}

export function hasRecentAuthentication(
  lastSignInAt: string | undefined,
  now = Date.now(),
) {
  const signedInAt = Date.parse(lastSignInAt || "");
  return (
    Number.isFinite(signedInAt) &&
    signedInAt <= now + 30_000 &&
    now - signedInAt <= RECENT_AUTHENTICATION_SECONDS * 1000
  );
}

export async function deletionAuditHash(userId: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(userId),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
