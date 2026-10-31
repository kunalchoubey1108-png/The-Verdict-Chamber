// Browser-safe: reads an approval's expiry for display only. The server still
// verifies the signature (lib/payments/approval.ts) before creating any order.

/** True when a token is present and expired (or unreadable); false when there is no token. */
export function approvalExpired(token: string | null | undefined, now = Date.now()): boolean {
  if (!token) return false;
  try {
    const payload = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const { expiresAt } = JSON.parse(atob(payload)) as { expiresAt?: unknown };
    return typeof expiresAt !== "number" || expiresAt < now;
  } catch {
    return true;
  }
}
