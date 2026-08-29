import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { conversations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const founderId = await getSession();
    if (!founderId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, action } = await req.json(); // action: 'accept' or 'reject'

    if (!conversationId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
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
      await db.update(conversations).set({ status: newStatus }).where(eq(conversations.id, conversationId));
      if (newStatus === "accepted") {
        const uRes = await db.select().from(users).where(eq(users.id, conv.userId)).limit(1);
        const u = uRes[0];
        if (u) {
          const newBalance = (parseFloat(u.balance || "0") + 0.20).toFixed(2);
          await db.update(users).set({ balance: newBalance }).where(eq(users.id, u.id));
        }
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to resolve feedback" }, { status: 500 });
  }
}
