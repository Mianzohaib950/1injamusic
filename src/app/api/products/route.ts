import { getDb, products } from "@/lib/server/db";
import { json } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureServerSchema();
  const productList = await getDb().select().from(products);
  return json(productList, { headers: { "Cache-Control": "no-store" } });
}
