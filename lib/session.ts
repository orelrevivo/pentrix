import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { db, localDb, isLocal } from "@/db/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE_NAME = "buildboard_session";
const SESSION_EXPIRY_DAYS = 30;

export async function createSession(userId: string) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  if (isLocal) {
    await localDb.sessions.insert({
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  } else if (db) {
    await db.insert(sessions).values({
      token,
      userId,
      createdAt: new Date(),
      expiresAt,
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  if (isLocal) {
    const session = await localDb.sessions.findFirst((s) => s.token === token);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }
    return session.userId;
  } else if (db) {
    const res = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    const session = res[0];
    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    return session.userId;
  }
  
  return null;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    if (isLocal) {
      await localDb.sessions.delete((s) => s.token === token);
    } else if (db) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
