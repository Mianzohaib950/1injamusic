import { asc, eq } from "drizzle-orm";
import { cmsPages, cmsSectionItems, cmsSections, getDb } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureServerSchema();
    const db = getDb();
    const [homePage] = await db.select().from(cmsPages).where(eq(cmsPages.pageKey, "home"));
    const pageId = homePage?.id ?? "home-page";
    const sections = await db.select().from(cmsSections).where(eq(cmsSections.pageId, pageId)).orderBy(asc(cmsSections.sortOrder));
    const payload = await Promise.all(
      sections.map(async (section: typeof cmsSections.$inferSelect) => {
        const items = await db.select().from(cmsSectionItems).where(eq(cmsSectionItems.sectionId, section.id)).orderBy(asc(cmsSectionItems.sortOrder));
        return { ...section, items };
      }),
    );
    return json({
      page: homePage ?? { id: "home-page", pageKey: "home", title: "Home Page", active: true },
      sections: payload,
    });
  } catch (error) {
    return serverError(error);
  }
}

