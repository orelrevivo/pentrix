import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    let user;
    if (isLocal) {
      user = await localDb.users.findFirst((u) => u.email === email);
    } else if (db) {
      const res = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = res[0] || null;
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    if (user.needsPasswordReset) {
      return NextResponse.json({
        success: true,
        needsPasswordReset: true,
        userId: user.id,
      });
    }

    await createSession(user.id);

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
