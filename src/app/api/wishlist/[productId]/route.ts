import { and, eq } from "drizzle-orm";
import { getDb, wishlists } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { noContent, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { productId } = await context.params;
    await getDb()
      .delete(wishlists)
      .where(and(eq(wishlists.userId, auth.sub), eq(wishlists.productId, productId)));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}

