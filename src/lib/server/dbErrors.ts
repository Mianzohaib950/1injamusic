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

function getErrorChain(error: unknown) {
  const chain: any[] = [];
  const seen = new Set<any>();
  let current: any = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    chain.push(current);
    seen.add(current);
    current = current.cause;
  }

  return chain;
}

export function getDatabaseErrorCode(error: unknown) {
  for (const entry of getErrorChain(error)) {
    const code = entry?.code;
    if (typeof code === "string" && code.length > 0) {
      return code;
    }
  }

  return undefined;
}

export function isRecoverableDatabaseError(error: unknown) {
  const code = getDatabaseErrorCode(error);
  if (isRecoverableDatabaseErrorCode(code)) return true;

  const combinedMessage = getErrorChain(error)
    .map((entry) => String(entry?.message ?? ""))
    .join(" ");

  return /SCRAM-SERVER-FIRST-MESSAGE|password must be a string|timeout|terminated unexpectedly|connect|ECONNREFUSED|ENOTFOUND/i.test(
    combinedMessage,
  );
}
