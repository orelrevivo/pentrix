import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    let ownerId = uuidv4();

    if (isLocal) {
      let existingUser = await localDb.users.findFirst((u) => u.email === email);
      if (existingUser) {
        return NextResponse.json({ success: false, error: "Email already in use" }, { status: 409 });
      }
      
      await localDb.users.insert({
        id: ownerId,
        email,
        passwordHash: password,
        balance: "0.00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (db) {
      const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUsers.length > 0) {
        return NextResponse.json({ success: false, error: "Email already in use" }, { status: 409 });
      }

      await db.insert(users).values({
        id: ownerId,
        email,
        passwordHash: password,
        balance: "0.00",
      });
    }

    return NextResponse.json({ success: true, user: { id: ownerId, email } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
  }
}
