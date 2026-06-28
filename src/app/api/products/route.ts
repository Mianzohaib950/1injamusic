import { getDb, products } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { withDatabaseRetry } from "@/lib/server/dbRetry";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" };

export async function GET() {
  try {
    const productList = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      return getDb().select().from(products);
    });
    return json(productList, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return serverError(error);
  }
}
