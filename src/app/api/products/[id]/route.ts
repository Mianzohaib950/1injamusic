import { eq } from "drizzle-orm";
import { getDb, products } from "@/lib/server/db";
import { apiError, json, serverError } from "@/lib/server/http";
import { withDatabaseRetry } from "@/lib/server/dbRetry";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      return getDb().select().from(products).where(eq(products.id, id));
    });
    const product = result[0];

    if (!product) {
      return apiError("Product not found", 404);
    }

    return json(product, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return serverError(error);
  }
}
