import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db, localDb, isLocal } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function clerkEmailWithTimeout(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const clerkUser = await Promise.race([
      client.users.getUser(userId),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Clerk lookup timed out")), 1_500)),
    ]);
    return clerkUser.emailAddresses[0]?.emailAddress || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    let exists = false;
    if (isLocal) {
      exists = Boolean(await localDb.users.findFirst((user) => user.id === userId));
    } else if (db) {
      exists = (await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)).length > 0;
    }

    if (!exists) {
      const email = await clerkEmailWithTimeout(userId) || `${userId}@pending.invalid`;
      if (isLocal) {
        const byEmail = await localDb.users.findFirst((user: any) => user.email === email);
        if (byEmail) {
          await localDb.users.update(byEmail.id, { id: userId });
        } else {
          await localDb.users.insert({
            id: userId,
            email,
            passwordHash: "",
            needsPasswordReset: false,
            balance: "0.00",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else if (db) {
        const byEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (byEmail.length > 0) {
          await db.update(users).set({ id: userId, updatedAt: new Date() }).where(eq(users.email, email));
        } else {
          await db.insert(users).values({
            id: userId,
            email,
            passwordHash: "",
            needsPasswordReset: false,
            balance: "0.00",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    return NextResponse.json({ success: true, authenticated: true, userId });
  } catch (error) {
    console.error("API /auth/me Error:", error);
    return NextResponse.json({ success: false, authenticated: false }, { status: 500 });
  }
}
