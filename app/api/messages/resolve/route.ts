import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { conversations, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { cleanText, rateLimit, rejectCrossSiteRequest, rejectLargeRequest } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const rejected = rejectCrossSiteRequest(req) || rejectLargeRequest(req, 5_000) || rateLimit(req, "messages-resolve", 30, 60_000);
    if (rejected) return rejected;
    const founderId = await getSession();
    if (!founderId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const conversationId = cleanText(body.conversationId, 100);
    const action = cleanText(body.action, 10);

    if (!conversationId || (action !== "accept" && action !== "reject")) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    let conv = null;
    if (isLocal) {
      conv = await localDb.conversations.findFirst((c) => c.id === conversationId && c.founderId === founderId);
    } else if (db) {
      const res = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
      conv = res[0] && res[0].founderId === founderId ? res[0] : null;
    }

    if (!conv) {
      return NextResponse.json({ success: false, error: "Conversation not found or unauthorized" }, { status: 404 });
    }

    if (conv.status !== "pending") {
      return NextResponse.json({ success: false, error: "Feedback already resolved" }, { status: 400 });
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";

    if (isLocal) {
      await localDb.conversations.update(conversationId, { status: newStatus });
      if (newStatus === "accepted") {
        const u = await localDb.users.findFirst((u) => u.id === conv.userId);
        if (u) {
          const newBalance = (parseFloat(u.balance || "0") + 0.20).toFixed(2);
          await localDb.users.update(u.id, { balance: newBalance });
        }
      }
    } else if (db) {
      const resolved = await db.update(conversations).set({ status: newStatus }).where(and(
        eq(conversations.id, conversationId),
        eq(conversations.founderId, founderId),
        eq(conversations.status, "pending"),
      )).returning({ id: conversations.id });
      if (!resolved.length) return NextResponse.json({ success: false, error: "Feedback already resolved" }, { status: 409 });
      if (newStatus === "accepted") {
        await db.update(users).set({ balance: sql`${users.balance} + 0.20` }).where(eq(users.id, conv.userId));
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to resolve feedback" }, { status: 500 });
  }
}
