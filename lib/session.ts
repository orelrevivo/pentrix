import { auth } from "@clerk/nextjs/server";

export async function createSession(userId: string) {
  // Handled by Clerk
}

export async function getSession() {
  const { userId } = await auth();
  return userId;
}

export async function clearSession() {
  // Handled by Clerk
}
