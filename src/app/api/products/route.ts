import { getDb, products } from "@/lib/server/db";
import { json } from "@/lib/server/http";
import { seedProducts } from "@/lib/server/productSeed";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET() {
  await ensureServerSchema();
  await seedProducts();
  const productList = await getDb().select().from(products);
  return json(productList);
}
