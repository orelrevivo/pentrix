import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects } from "@/db/schema";
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
      ownerProjects = await localDb.projects.findMany((p) => p.ownerId === ownerId);
    } else if (db) {
      ownerProjects = await db.select().from(projects).where(eq(projects.ownerId, ownerId));
    }

    return NextResponse.json({ success: true, projects: ownerProjects });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard projects" }, { status: 500 });
  }
}
