import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTileSize } from "@/lib/canvas";
import { getSession } from "@/lib/session";
import { cleanOptionalText, cleanText, isHttpUrl, rateLimit, rejectCrossSiteRequest, rejectLargeRequest } from "@/lib/security";

const PLAN_PRICES: Record<string, number> = { small: 1, builder: 5, featured: 20, premium: 50 };
const ALLOWED_STATUSES = new Set(["Building now", "Live", "Looking for feedback", "Looking for users", "Paused", "Not working right now"]);

async function findOwnedProject(id: string, ownerId: string) {
  if (isLocal) return localDb.projects.findFirst((p) => p.id === id && p.ownerId === ownerId);
  if (db) {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0]?.ownerId === ownerId ? result[0] : null;
  }
  return null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rejected = rejectCrossSiteRequest(req);
  if (rejected) return rejected;
  const ownerId = await getSession();
  if (!ownerId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const limited = rateLimit(req, "dashboard-project-read", 120, 60_000);
  if (limited) return limited;

  const { id } = await params;
  const project = await findOwnedProject(id, ownerId);
  if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  return NextResponse.json({ success: true, project });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rejected = rejectCrossSiteRequest(req) || rejectLargeRequest(req, 3_000_000) || rateLimit(req, "dashboard-project-update", 30, 60_000);
    if (rejected) return rejected;

    const ownerId = await getSession();
    if (!ownerId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existingProject = await findOwnedProject(id, ownerId);
    if (!existingProject) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    const textFields: Record<string, number> = {
      name: 100, tagline: 180, description: 5000, founderName: 100,
      category: 80, lookingFor: 500, vehicleId: 50,
    };
    for (const [field, maxLength] of Object.entries(textFields)) {
      if (body[field] !== undefined) {
        const value = cleanText(body[field], maxLength);
        if (value === null) return NextResponse.json({ success: false, error: `Invalid ${field}` }, { status: 400 });
        updates[field] = value;
      }
    }

    if (body.status !== undefined) {
      const status = cleanText(body.status, 30);
      if (!status || !ALLOWED_STATUSES.has(status)) return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
      updates.status = status;
    }
    if (body.websiteUrl !== undefined) {
      const value = cleanText(body.websiteUrl, 2048);
      if (!value || !isHttpUrl(value)) return NextResponse.json({ success: false, error: "Invalid website URL" }, { status: 400 });
      updates.websiteUrl = value;
    }
    for (const field of ["logoUrl", "screenshotUrl"] as const) {
      if (body[field] !== undefined) {
        const value = cleanOptionalText(body[field], 2_500_000);
        if (value === null) return NextResponse.json({ success: false, error: `Invalid ${field}` }, { status: 400 });
        updates[field] = value;
      }
    }
    if (body.isPublished !== undefined) {
      if (typeof body.isPublished !== "boolean") return NextResponse.json({ success: false, error: "Invalid publication status" }, { status: 400 });
      if (body.isPublished && existingProject.paymentStatus !== "paid") {
        return NextResponse.json({ success: false, error: "Payment is required before publishing" }, { status: 403 });
      }
      updates.isPublished = body.isPublished;
    }
    if (body.plan !== undefined) {
      const plan = cleanText(body.plan, 20);
      if (!plan || PLAN_PRICES[plan] === undefined) return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 400 });
      if (PLAN_PRICES[plan] > (PLAN_PRICES[existingProject.plan] ?? 0)) {
        return NextResponse.json({ success: false, error: "Plan upgrades must be completed through checkout" }, { status: 403 });
      }
      updates.plan = plan;
      updates.tileSize = `${getTileSize(plan)}px`;
    }

    if (isLocal) await localDb.projects.update(id, updates);
    else if (db) await db.update(projects).set({ ...updates, updatedAt: new Date() }).where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}
