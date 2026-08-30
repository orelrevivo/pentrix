import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects, payments, users } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/session";
import { getTileSize } from "@/lib/canvas";
import { cleanOptionalText, cleanText, rateLimit, rejectCrossSiteRequest, rejectLargeRequest } from "@/lib/security";

const PLAN_PRICES: Record<string, number> = { small: 1, builder: 5, featured: 20, premium: 50 };
const FREE_COUPON = "EARLYBUILDER";

export async function POST(req: Request) {
  try {
    const rejected = rejectCrossSiteRequest(req) || rejectLargeRequest(req, 10_000) || rateLimit(req, "credit-payment", 10, 60_000);
    if (rejected) return rejected;

    const userId = await getSession();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const projectId = cleanText(body.projectId, 100);
    const planType = cleanText(body.planType, 20)?.toLowerCase();
    const couponCode = cleanOptionalText(body.couponCode, 50)?.toUpperCase();
    if (!projectId || !planType || PLAN_PRICES[planType] === undefined) {
      return NextResponse.json({ success: false, error: "Invalid payment details" }, { status: 400 });
    }

    let project: any = null;
    let owner: any = null;
    if (isLocal) {
      project = await localDb.projects.findFirst((p) => p.id === projectId);
      owner = project ? await localDb.users.findFirst((u) => u.id === project.ownerId) : null;
    } else if (db) {
      project = (await db.select().from(projects).where(eq(projects.id, projectId)).limit(1))[0] || null;
      owner = project ? (await db.select().from(users).where(eq(users.id, project.ownerId)).limit(1))[0] || null : null;
    }
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    if (project.ownerId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (!owner) return NextResponse.json({ success: false, error: "Owner not found" }, { status: 404 });
    if (project.paymentStatus === "paid") {
      return NextResponse.json({ success: false, error: "Use checkout to change an already-paid plan" }, { status: 409 });
    }

    const couponValid = couponCode === FREE_COUPON && planType === "small";
    const price = couponValid ? 0 : PLAN_PRICES[planType];
    const currentBalance = Number(owner.balance || 0);
    if (!Number.isFinite(currentBalance) || currentBalance < price) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 });
    }
    const newBalance = (currentBalance - price).toFixed(2);
    const newPayment = {
      id: uuidv4(), projectId, provider: "credit", providerPaymentId: `credit_${uuidv4()}`,
      amount: price.toFixed(2), currency: "USD", status: "paid", createdAt: new Date().toISOString(),
    };

    if (isLocal) {
      const latestProject = await localDb.projects.findFirst((p) => p.id === projectId);
      if (latestProject?.paymentStatus === "paid") return NextResponse.json({ success: false, error: "Payment already processed" }, { status: 409 });
      if (price > 0) await localDb.users.update(owner.id, { balance: newBalance });
      await localDb.payments.insert(newPayment);
      await localDb.projects.update(projectId, { paymentStatus: "paid", isPublished: true, plan: planType, tileSize: `${getTileSize(planType)}px` });
    } else if (db) {
      if (price > 0) {
        const debited = await db.update(users).set({ balance: newBalance }).where(and(eq(users.id, owner.id), gte(users.balance, price.toFixed(2)))).returning({ id: users.id });
        if (!debited.length) return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 409 });
      }
      await db.insert(payments).values({ ...newPayment, createdAt: new Date() });
      await db.update(projects).set({ paymentStatus: "paid", isPublished: true, plan: planType, tileSize: `${getTileSize(planType)}px`, updatedAt: new Date() }).where(eq(projects.id, projectId));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to process credit payment" }, { status: 500 });
  }
}
