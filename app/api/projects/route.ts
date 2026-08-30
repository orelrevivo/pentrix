import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { findCanvasPosition, getTileSize } from "@/lib/canvas";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/session";
import { cleanOptionalText, cleanText, isHttpUrl, rateLimit, rejectCrossSiteRequest, rejectLargeRequest } from "@/lib/security";

const ALLOWED_PLANS = new Set(["small", "builder", "featured", "premium"]);
const ALLOWED_STATUSES = new Set(["Building now", "Live", "Looking for feedback", "Looking for users", "Paused", "Not working right now"]);

function toPublicProject(project: any, currentUserId: string | null) {
  const { paymentStatus: _paymentStatus, ownerId, views: _views, clicks: _clicks, updatedAt: _updatedAt, ...publicProject } = project;
  return { ...publicProject, isOwner: Boolean(currentUserId && ownerId === currentUserId) };
}

export async function GET() {
  try {
    const currentUserId = await getSession();
    let allProjects: any[];
    if (isLocal) {
      allProjects = await localDb.projects.findMany((p) => p.isPublished === true);
    } else if (db) {
      allProjects = await db.select().from(projects).where(eq(projects.isPublished, true));
    } else {
      allProjects = [];
    }
    return NextResponse.json({ success: true, projects: allProjects.map((project) => toPublicProject(project, currentUserId)) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rejected = rejectCrossSiteRequest(req) || rejectLargeRequest(req, 3_000_000) || rateLimit(req, "project-create", 10, 60_000);
    if (rejected) return rejected;
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
      plan,
    } = body;

    const validated = {
      name: cleanText(name, 100), tagline: cleanText(tagline, 180), description: cleanText(description, 5000),
      websiteUrl: cleanText(websiteUrl, 2048), logoUrl: cleanText(logoUrl, 2_000_000),
      screenshotUrl: cleanOptionalText(screenshotUrl, 2_500_000), founderName: cleanText(founderName, 100),
      category: cleanText(category, 80), status: cleanText(status, 30), lookingFor: cleanText(lookingFor, 500),
      plan: cleanText(plan, 20),
    };
    if (Object.values(validated).some((value) => value === null) || !validated.websiteUrl || !isHttpUrl(validated.websiteUrl) ||
      !validated.plan || !ALLOWED_PLANS.has(validated.plan) || !validated.status || !ALLOWED_STATUSES.has(validated.status)) {
      return NextResponse.json({ success: false, error: "Invalid project details" }, { status: 400 });
    }

    const sessionUserId = await getSession();
    if (!sessionUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let ownerId = sessionUserId as string;

    let existingProjects: any[] = [];
    if (isLocal) {
      existingProjects = await localDb.projects.findMany();
    } else if (db) {
      existingProjects = await db.select().from(projects);
    }

    const { x, y } = findCanvasPosition(validated.plan, existingProjects);
    const tileSize = getTileSize(validated.plan).toString() + "px";
    const projectId = uuidv4();

    const newProject = {
      id: projectId,
      ownerId,
      name: validated.name!,
      tagline: validated.tagline!,
      description: validated.description!,
      websiteUrl: validated.websiteUrl,
      logoUrl: validated.logoUrl!,
      screenshotUrl: validated.screenshotUrl || "",
      founderName: validated.founderName!,
      category: validated.category!,
      status: validated.status,
      lookingFor: validated.lookingFor!,
      plan: validated.plan,
      paymentStatus: "draft",
      isPublished: false,
      canvasX: x,
      canvasY: y,
      tileSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isLocal) {
      await localDb.projects.insert(newProject);
    } else if (db) {
      await db.insert(projects).values({
        ...newProject,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }


    return NextResponse.json({ success: true, project: toPublicProject(newProject, ownerId) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create project draft" }, { status: 500 });
  }
}
