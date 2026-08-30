import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { supportTickets } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/session";
import { cleanText, isValidEmail, rateLimit, rejectCrossSiteRequest, rejectLargeRequest } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const rejected = rejectCrossSiteRequest(req) || rejectLargeRequest(req, 20_000) || rateLimit(req, "contact", 5, 10 * 60_000);
    if (rejected) return rejected;
    const { email: rawEmail, issueType: rawIssueType, message: rawMessage } = await req.json();
    const email = cleanText(rawEmail, 254);
    const issueType = cleanText(rawIssueType, 80);
    const message = cleanText(rawMessage, 5000);
    const userId = await getSession();

    if (!email || !isValidEmail(email) || !issueType || !message) {
      return NextResponse.json({ success: false, error: "Invalid contact request" }, { status: 400 });
    }

    const ticketId = uuidv4();
    const newTicket = {
      id: ticketId,
      userId,
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
