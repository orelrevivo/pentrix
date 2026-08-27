import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { conversations, messages, projects } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    let userConversations = [];
    if (isLocal) {
      const convs = await localDb.conversations.findMany(
        (c) => c.founderId === userId || c.userId === userId
      );
      const allMsgs = await localDb.messages.findMany();
      userConversations = convs.map((c: any) => {
        const msgs = allMsgs.filter((m: any) => m.conversationId === c.id);
        return { ...c, messages: msgs };
      });
    } else if (db) {
      const convs = await db.select().from(conversations).where(
        or(eq(conversations.founderId, userId), eq(conversations.userId, userId))
      );
      
      const convIds = convs.map((c: any) => c.id);
      let msgs: any[] = [];
      if (convIds.length > 0) {
        msgs = await db.select().from(messages); // Simple fetch all since it's small, or use inArray
      }
      
      userConversations = convs.map((c: any) => ({
        ...c,
        messages: msgs.filter((m: any) => m.conversationId === c.id)
      }));
    }

    return NextResponse.json({ success: true, conversations: userConversations });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { projectId, senderId, content } = await req.json();

    if (!projectId || !senderId || !content) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    let projectFound = null;
    if (isLocal) {
      projectFound = await localDb.projects.findFirst((p) => p.id === projectId);
    } else if (db) {
      const res = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      projectFound = res[0];
    }

    if (!projectFound) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    let convId = uuidv4();
    let isNewConv = true;

    let hasExisting = false;
    if (isLocal) {
      const existing = await localDb.conversations.findFirst((c) => c.projectId === projectId && c.userId === senderId);
      if (existing) {
        hasExisting = true;
      }
    } else if (db) {
      const existing = await db.select().from(conversations).where(
        and(eq(conversations.projectId, projectId), eq(conversations.userId, senderId))
      ).limit(1);
      if (existing.length > 0) {
        hasExisting = true;
      }
    }

    if (hasExisting) {
      return NextResponse.json({ success: false, error: "You have already submitted feedback for this project." }, { status: 400 });
    }



    if (isNewConv) {
      if (isLocal) {
        await localDb.conversations.insert({
          id: convId,
          projectId,
          founderId: projectFound.ownerId,
          userId: senderId,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      } else if (db) {
        await db.insert(conversations).values({
          id: convId,
          projectId,
          founderId: projectFound.ownerId,
          userId: senderId,
          status: "pending",
        });
      }
    }

    const msgId = uuidv4();
    if (isLocal) {
      const newMsg = {
        id: msgId,
        conversationId: convId,
        senderId,
        content,
        createdAt: new Date().toISOString(),
      };
      await localDb.messages.insert(newMsg);
      return NextResponse.json({ success: true, message: newMsg });
    } else if (db) {
      const newMsg = {
        id: msgId,
        conversationId: convId,
        senderId,
        content,
      };
      await db.insert(messages).values(newMsg);
      return NextResponse.json({ success: true, message: newMsg });
    }

    return NextResponse.json({ success: false, error: "No DB" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
