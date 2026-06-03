export function isRecoverableDatabaseErrorCode(code?: string) {
  return [
    "28P01",
    "3D000",
    "42P01",
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ECONNRESET",
    "EAI_AGAIN",
  ].includes(code ?? "");
}

export function getDatabaseErrorCode(error: unknown) {
  return (error as any)?.cause?.code ?? (error as any)?.code;
}

export function isRecoverableDatabaseError(error: unknown) {
  const code = getDatabaseErrorCode(error);
  if (isRecoverableDatabaseErrorCode(code)) return true;

  const message = String((error as Error)?.message ?? "");
  return /SCRAM-SERVER-FIRST-MESSAGE|password must be a string|timeout|connect|ECONNREFUSED|ENOTFOUND/i.test(
    message,
  );
}
