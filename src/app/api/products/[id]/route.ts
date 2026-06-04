import { eq } from "drizzle-orm";
import { getDb, products } from "@/lib/server/db";
import { apiError, json } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensureServerSchema();
  const { id } = await context.params;
  const result = await getDb().select().from(products).where(eq(products.id, id));
  const product = result[0];

  if (!product) {
    return apiError("Product not found", 404);
  }

  return json(product);
}
