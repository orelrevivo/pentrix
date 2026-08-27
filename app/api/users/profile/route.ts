import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
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

    return NextResponse.json({ success: true, email: user.email, balance: user.balance || "0.00" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}
