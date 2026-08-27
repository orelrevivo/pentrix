import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { findCanvasPosition, getTileSize } from "@/lib/canvas";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    let allProjects;
    if (isLocal) {
      allProjects = await localDb.projects.findMany((p) => p.isPublished === true);
    } else if (db) {
      allProjects = await db.select().from(projects).where(eq(projects.isPublished, true));
    } else {
      allProjects = [];
    }
    return NextResponse.json({ success: true, projects: allProjects });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
      email,
      password,
    } = body;

    if (!name || !tagline || !description || !websiteUrl || !logoUrl || !founderName || !category || !status || !lookingFor || !plan || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    let ownerId = "";
    if (isLocal) {
      let user = await localDb.users.findFirst((u) => u.email === email);
      if (!user) {
        ownerId = uuidv4();
        await localDb.users.insert({
          id: ownerId,
          email,
          passwordHash: password,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        if (user.passwordHash !== password) {
          return NextResponse.json({ success: false, error: "Incorrect password for this email" }, { status: 401 });
        }
        ownerId = user.id;
      }
    } else if (db) {
      const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUsers.length === 0) {
        ownerId = uuidv4();
        await db.insert(users).values({
          id: ownerId,
          email,
          passwordHash: password,
        });
      } else {
        const user = existingUsers[0];
        if (user.passwordHash !== password) {
          return NextResponse.json({ success: false, error: "Incorrect password for this email" }, { status: 401 });
        }
        ownerId = user.id;
      }
    }

    let existingProjects = [];
    if (isLocal) {
      existingProjects = await localDb.projects.findMany();
    } else if (db) {
      existingProjects = await db.select().from(projects);
    }

    const { x, y } = findCanvasPosition(plan, existingProjects);
    const tileSize = getTileSize(plan).toString() + "px";
    const projectId = uuidv4();

    const newProject = {
      id: projectId,
      ownerId,
      name,
      tagline,
      description,
      websiteUrl,
      logoUrl,
      screenshotUrl: screenshotUrl || "",
      founderName,
      category,
      status,
      lookingFor,
      plan,
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

    return NextResponse.json({ success: true, project: newProject });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create project draft" }, { status: 500 });
  }
}
