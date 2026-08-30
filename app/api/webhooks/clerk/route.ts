import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db, localDb, isLocal } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit, rejectLargeRequest } from '@/lib/security';

export async function POST(req: Request) {
  const rejected = rejectLargeRequest(req, 1_000_000) || rateLimit(req, 'clerk-webhook', 120, 60_000);
  if (rejected) return rejected;
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response('Error: Missing webhook secret', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response('Error occured', {
      status: 400
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const id = evt.data.id;
    const email = evt.data.email_addresses[0]?.email_address;
    if (!email) {
      return new Response('No email found', { status: 400 });
    }

    if (isLocal) {
      const existing = await localDb.users.findFirst((u: any) => u.id === id);
      if (existing) {
        await localDb.users.update(id as string, { email });
      } else {
        await localDb.users.insert({
          id: id as string,
          email,
          passwordHash: "",
          needsPasswordReset: false,
          balance: "0.00",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (db) {
      const existing = await db.select().from(users).where(eq(users.id, id as string)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, id as string));
      } else {
        await db.insert(users).values({
          id: id as string,
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

  return new Response('', { status: 200 });
}
