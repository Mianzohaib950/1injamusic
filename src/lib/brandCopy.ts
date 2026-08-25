/** Keeps legacy CMS/database copy aligned with the current public brand name. */
export function normalizeBrandCopy(value: unknown): string {
  return String(value ?? "").replace(/1\s+Jamaica\s+Music/gi, "1 in Jamaica Music");
}
