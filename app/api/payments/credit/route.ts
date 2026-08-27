import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects, payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const PLAN_PRICES: Record<string, number> = {
  small: 1,
  builder: 5,
  featured: 20,
  premium: 50,
};

export async function POST(req: Request) {
  try {
    const { projectId, planType, couponCode } = await req.json();

    if (!projectId || !planType) {
      return NextResponse.json({ success: false, error: "Missing required details" }, { status: 400 });
    }

    let price = PLAN_PRICES[planType.toLowerCase()];
    if (price === undefined) {
      return NextResponse.json({ success: false, error: "Invalid plan type" }, { status: 400 });
    }

    const isCouponValid = couponCode && couponCode.toUpperCase() === "EARLYBUILDER" && planType.toLowerCase() === "small";
    if (isCouponValid) {
      price = 0;
    }

    // Find project to get ownerId
    let project = null;
    if (isLocal) {
      project = await localDb.projects.findFirst((p) => p.id === projectId);
    } else if (db) {
      const res = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      project = res[0] || null;
    }

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Find owner
    let owner = null;
    if (isLocal) {
      owner = await localDb.users.findFirst((u) => u.id === project.ownerId);
    } else if (db) {
      const res = await db.select().from(users).where(eq(users.id, project.ownerId)).limit(1);
      owner = res[0] || null;
    }

    if (!owner) {
      return NextResponse.json({ success: false, error: "Owner not found" }, { status: 404 });
    }

    let newBalance = owner.balance;
    if (price > 0) {
      const balanceNum = parseFloat(owner.balance || "0");
      if (balanceNum < price) {
        return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 });
      }
      newBalance = (balanceNum - price).toFixed(2);
    }

    // Deduct balance and update project
    const payId = uuidv4();
    const newPayment = {
      id: payId,
      projectId,
      provider: "credit",
      providerPaymentId: "credit_" + uuidv4(),
      amount: price.toString(),
      currency: "USD",
      status: "paid",
      createdAt: new Date().toISOString(),
    };

    if (isLocal) {
      await localDb.payments.insert(newPayment);
      await localDb.users.update(owner.id, { balance: newBalance });
      await localDb.projects.update(projectId, {
        paymentStatus: "paid",
        isPublished: true,
        plan: planType,
      });
    } else if (db) {
      await db.insert(payments).values({
        ...newPayment,
        createdAt: new Date(),
      });
      await db.update(users).set({ balance: newBalance }).where(eq(users.id, owner.id));
      await db
        .update(projects)
        .set({
          paymentStatus: "paid",
          isPublished: true,
          plan: planType,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to process credit payment" }, { status: 500 });
  }
}
