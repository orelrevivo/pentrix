import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { supportTickets } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { email, issueType, message, userId } = await req.json();

    if (!email || !issueType || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const ticketId = uuidv4();
    const newTicket = {
      id: ticketId,
      userId: userId || null,
      email,
      issueType,
      message,
      createdAt: new Date().toISOString(),
    };

    if (isLocal) {
      await localDb.supportTickets.insert(newTicket);
    } else if (db) {
      await db.insert(supportTickets).values({
        ...newTicket,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to submit contact request" }, { status: 500 });
  }
}
