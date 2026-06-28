import { resetDbConnection } from "./db";
import { isRecoverableDatabaseError } from "./dbErrors";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (!isRecoverableDatabaseError(error)) throw error;

    await resetDbConnection();
    await delay(250);
    return operation();
  }
}
