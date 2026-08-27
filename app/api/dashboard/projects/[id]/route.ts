import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTileSize } from "@/lib/canvas";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      tagline,
      description,
      websiteUrl,
      logoUrl,
      screenshotUrl,
      founderName,
      category,
      status,
      lookingFor,
      isPublished,
      plan,
    } = body;

    let existingProject;
    if (isLocal) {
      existingProject = await localDb.projects.findFirst((p) => p.id === id);
    } else if (db) {
      const res = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      existingProject = res[0] || null;
    }

    if (!existingProject) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (tagline !== undefined) updates.tagline = tagline;
    if (description !== undefined) updates.description = description;
    if (websiteUrl !== undefined) updates.websiteUrl = websiteUrl;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (screenshotUrl !== undefined) updates.screenshotUrl = screenshotUrl;
    if (founderName !== undefined) updates.founderName = founderName;
    if (category !== undefined) updates.category = category;
    if (status !== undefined) updates.status = status;
    if (lookingFor !== undefined) updates.lookingFor = lookingFor;
    if (isPublished !== undefined) updates.isPublished = isPublished;

    if (plan !== undefined && plan !== existingProject.plan) {
      updates.plan = plan;
      updates.tileSize = getTileSize(plan).toString() + "px";
    }

    if (isLocal) {
      await localDb.projects.update(id, updates);
    } else if (db) {
      const dbUpdates: any = {};
      if (name !== undefined) dbUpdates.name = name;
      if (tagline !== undefined) dbUpdates.tagline = tagline;
      if (description !== undefined) dbUpdates.description = description;
      if (websiteUrl !== undefined) dbUpdates.websiteUrl = websiteUrl;
      if (logoUrl !== undefined) dbUpdates.logoUrl = logoUrl;
      if (screenshotUrl !== undefined) dbUpdates.screenshotUrl = screenshotUrl;
      if (founderName !== undefined) dbUpdates.founderName = founderName;
      if (category !== undefined) dbUpdates.category = category;
      if (status !== undefined) dbUpdates.status = status;
      if (lookingFor !== undefined) dbUpdates.lookingFor = lookingFor;
      if (isPublished !== undefined) dbUpdates.isPublished = isPublished;
      if (plan !== undefined) {
        dbUpdates.plan = plan;
        dbUpdates.tileSize = getTileSize(plan).toString() + "px";
      }
      dbUpdates.updatedAt = new Date();
      await db.update(projects).set(dbUpdates).where(eq(projects.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}
