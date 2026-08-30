import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { rateLimit, rejectCrossSiteRequest, rejectLargeRequest } from "@/lib/security";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rejected = rejectCrossSiteRequest(req) || rejectLargeRequest(req, 2_000) || rateLimit(req, "project-stats", 60, 60_000);
    if (rejected) return rejected;
    const { id } = await params;
    const { type } = await req.json();

    if (type !== "click" && type !== "view") {
      return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }

    if (isLocal) {
      const proj = await localDb.projects.findFirst((p) => p.id === id);
      if (proj) {
        const updates: any = {};
        if (type === "click") {
          updates.clicks = (proj.clicks || 0) + 1;
        } else {
          updates.views = (proj.views || 0) + 1;
        }
        await localDb.projects.update(id, updates);
      }
    } else if (db) {
      if (type === "click") {
        await db
          .update(projects)
          .set({ clicks: sql`${projects.clicks} + 1` })
          .where(eq(projects.id, id));
      } else {
        await db
          .update(projects)
          .set({ views: sql`${projects.views} + 1` })
          .where(eq(projects.id, id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update stats" }, { status: 500 });
  }
}
