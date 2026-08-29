import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const userId = await getSession();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let user;
    if (isLocal) {
      user = await localDb.users.findFirst((u) => u.id === userId);
    } else if (db) {
      const res = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      user = res[0] || null;
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, balance: user.balance || "0.00" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch balance" }, { status: 500 });
  }
}
