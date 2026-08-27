import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects, payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { projectId, orderId, amount, planType } = await req.json();

    if (!projectId || !orderId || !amount) {
      return NextResponse.json({ success: false, error: "Missing required details" }, { status: 400 });
    }

    const payId = uuidv4();
    const newPayment = {
      id: payId,
      projectId,
      provider: "paypal",
      providerPaymentId: orderId,
      amount: amount.toString(),
      currency: "USD",
      status: "paid",
      createdAt: new Date().toISOString(),
    };

    const PLAN_PRICES: Record<string, number> = {
      small: 1,
      builder: 5,
      featured: 20,
      premium: 50,
    };

    let project = null;
    if (isLocal) {
      project = await localDb.projects.findFirst((p) => p.id === projectId);
    } else if (db) {
      const res = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      project = res[0] || null;
    }

    if (project) {
      const planKey = (planType || project.plan || "small").toLowerCase();
      const planPrice = PLAN_PRICES[planKey] || 0;
      const amountPaid = parseFloat(amount.toString());
      if (planPrice > amountPaid) {
        const creditUsed = planPrice - amountPaid;
        if (isLocal) {
          const owner = await localDb.users.findFirst((u) => u.id === project.ownerId);
          if (owner) {
            const currentBal = parseFloat(owner.balance || "0");
            const newBal = Math.max(0, currentBal - creditUsed).toFixed(2);
            await localDb.users.update(owner.id, { balance: newBal });
          }
        } else if (db) {
          const ownerRes = await db.select().from(users).where(eq(users.id, project.ownerId)).limit(1);
          const owner = ownerRes[0];
          if (owner) {
            const currentBal = parseFloat(owner.balance || "0");
            const newBal = Math.max(0, currentBal - creditUsed).toFixed(2);
            await db.update(users).set({ balance: newBal }).where(eq(users.id, owner.id));
          }
        }
      }
    }

    if (isLocal) {
      await localDb.payments.insert(newPayment);
      await localDb.projects.update(projectId, {
        paymentStatus: "paid",
        isPublished: true,
        plan: planType || "small",
      });
    } else if (db) {
      await db.insert(payments).values({
        ...newPayment,
        createdAt: new Date(),
      });
      await db
        .update(projects)
        .set({
          paymentStatus: "paid",
          isPublished: true,
          plan: planType || "small",
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to process payment capture" }, { status: 500 });
  }
}
