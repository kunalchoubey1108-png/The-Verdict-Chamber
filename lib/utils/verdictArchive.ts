import type { FullVerdict } from "@/lib/types/verdict";

export const VERDICT_ARCHIVE_VERSION = 1;

export function createVerdictArchive(
  records: FullVerdict[],
  exportedAt = new Date().toISOString(),
): string {
  return JSON.stringify(
    {
      format: "verdictpay-archive",
      version: VERDICT_ARCHIVE_VERSION,
      exportedAt,
      records,
    },
    null,
    2,
  );
}
