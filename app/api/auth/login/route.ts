import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    if (!user || user.passwordHash !== password) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
