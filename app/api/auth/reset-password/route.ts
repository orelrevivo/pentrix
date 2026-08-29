import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ success: false, error: "userId and newPassword are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    if (isLocal) {
      const user = await localDb.users.findFirst((u) => u.id === userId);
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
      await localDb.users.update(userId, { passwordHash, needsPasswordReset: false });
    } else if (db) {
      const res = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!res[0]) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
      await db
        .update(users)
        .set({ passwordHash, needsPasswordReset: false, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    await createSession(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 });
  }
}
