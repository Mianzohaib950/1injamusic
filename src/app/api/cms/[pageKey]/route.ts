import { asc, eq } from "drizzle-orm";
import { cmsPages, cmsSectionItems, cmsSections, getDb } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ pageKey: string }> },
) {
  try {
    await ensureServerSchema();
    const { pageKey: rawPageKey } = await context.params;
    const pageKey = String(rawPageKey ?? "").trim().toLowerCase();
    if (!pageKey) {
      return json({ error: "pageKey is required" }, { status: 400 });
    }

    const db = getDb();
    const [page] = await db.select().from(cmsPages).where(eq(cmsPages.pageKey, pageKey));
    if (!page) {
      return json({ error: `CMS page not found: ${pageKey}` }, { status: 404 });
    }

    const sections = await db
      .select()
      .from(cmsSections)
      .where(eq(cmsSections.pageId, page.id))
      .orderBy(asc(cmsSections.sortOrder));

    const payload = await Promise.all(
      sections.map(async (section: typeof cmsSections.$inferSelect) => {
        const items = await db
          .select()
          .from(cmsSectionItems)
          .where(eq(cmsSectionItems.sectionId, section.id))
          .orderBy(asc(cmsSectionItems.sortOrder));
        return { ...section, items };
      }),
    );

    return json({
      page,
      sections: payload,
    });
  } catch (error) {
    return serverError(error);
  }
}
