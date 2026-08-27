import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects, conversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json({ success: false, error: "Missing ownerId parameter" }, { status: 400 });
    }

    let ownerProjects = [];
    if (isLocal) {
      const projs = await localDb.projects.findMany((p) => p.ownerId === ownerId);
      const convs = await localDb.conversations.findMany((c) => c.status === "accepted");
      ownerProjects = projs.map((p: any) => {
        const count = convs.filter((c: any) => c.projectId === p.id).length;
        return { ...p, feedbackCount: count };
      });
    } else if (db) {
      const projs = await db.select().from(projects).where(eq(projects.ownerId, ownerId));
      const convs = await db.select().from(conversations).where(eq(conversations.status, "accepted"));
      ownerProjects = projs.map((p: any) => {
        const count = convs.filter((c: any) => c.projectId === p.id).length;
        return { ...p, feedbackCount: count };
      });
    }

    return NextResponse.json({ success: true, projects: ownerProjects });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard projects" }, { status: 500 });
  }
}
