import { NextResponse } from "next/server";
import { db, localDb, isLocal } from "@/db/db";
import { projects, payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/session";
import { getTileSize } from "@/lib/canvas";
import { cleanText, rateLimit, rejectCrossSiteRequest, rejectLargeRequest } from "@/lib/security";

const PLAN_PRICES: Record<string, number> = { small: 1, builder: 5, featured: 20, premium: 50 };

type PayPalOrder = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: { captures?: Array<{ status?: string; amount?: { currency_code?: string; value?: string } }> };
  }>;
};

async function verifyPayPalOrder(orderId: string): Promise<PayPalOrder | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const baseUrl = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${authHeader}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!tokenResponse.ok) return null;
  const tokenBody = await tokenResponse.json() as { access_token?: string };
  if (!tokenBody.access_token) return null;

  const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    cache: "no-store",
  });
  if (!orderResponse.ok) return null;
  return orderResponse.json() as Promise<PayPalOrder>;
}

export async function POST(req: Request) {
  try {
    const rejected = rejectCrossSiteRequest(req) || rejectLargeRequest(req, 20_000) || rateLimit(req, "paypal-capture", 10, 60_000);
    if (rejected) return rejected;

    const userId = await getSession();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const projectId = cleanText(body.projectId, 100);
    const orderId = cleanText(body.orderId, 100);
    const planType = cleanText(body.planType, 20)?.toLowerCase();
    if (!projectId || !orderId || !planType || PLAN_PRICES[planType] === undefined) {
      return NextResponse.json({ success: false, error: "Invalid payment details" }, { status: 400 });
    }

    let project: any = null;
    let owner: any = null;
    if (isLocal) {
      project = await localDb.projects.findFirst((p) => p.id === projectId);
      owner = project ? await localDb.users.findFirst((u) => u.id === project.ownerId) : null;
      if (await localDb.payments.findFirst((p) => p.providerPaymentId === orderId)) {
        return NextResponse.json({ success: false, error: "Payment has already been processed" }, { status: 409 });
      }
    } else if (db) {
      project = (await db.select().from(projects).where(eq(projects.id, projectId)).limit(1))[0] || null;
      owner = project ? (await db.select().from(users).where(eq(users.id, project.ownerId)).limit(1))[0] || null : null;
      if ((await db.select().from(payments).where(eq(payments.providerPaymentId, orderId)).limit(1)).length) {
        return NextResponse.json({ success: false, error: "Payment has already been processed" }, { status: 409 });
      }
    }
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    if (project.ownerId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (!owner) return NextResponse.json({ success: false, error: "Owner not found" }, { status: 404 });

    const targetPrice = PLAN_PRICES[planType];
    const currentPrice = project.paymentStatus === "paid" ? (PLAN_PRICES[project.plan] ?? 0) : 0;
    if (targetPrice <= currentPrice) return NextResponse.json({ success: false, error: "No upgrade payment is required" }, { status: 400 });

    const availableCredit = project.paymentStatus === "paid" ? 0 : Math.max(0, Number(owner.balance || 0));
    const creditUsed = Math.min(availableCredit, targetPrice);
    const expectedAmount = Number((targetPrice - creditUsed).toFixed(2));
    if (expectedAmount <= 0) return NextResponse.json({ success: false, error: "Use credit checkout for a zero-dollar payment" }, { status: 400 });

    const paypalOrder = await verifyPayPalOrder(orderId);
    if (!paypalOrder) {
      return NextResponse.json({ success: false, error: "Unable to verify PayPal payment" }, { status: 503 });
    }
    const unit = paypalOrder.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const verifiedAmount = Number(capture?.amount?.value ?? unit?.amount?.value);
    const verifiedCurrency = capture?.amount?.currency_code ?? unit?.amount?.currency_code;
    if (
      paypalOrder.id !== orderId || paypalOrder.status !== "COMPLETED" || capture?.status !== "COMPLETED" ||
      unit?.custom_id !== projectId || verifiedCurrency !== "USD" ||
      !Number.isFinite(verifiedAmount) || Math.abs(verifiedAmount - expectedAmount) > 0.001
    ) {
      return NextResponse.json({ success: false, error: "PayPal payment did not match this purchase" }, { status: 400 });
    }

    const newPayment = {
      id: uuidv4(), projectId, provider: "paypal", providerPaymentId: orderId,
      amount: expectedAmount.toFixed(2), currency: "USD", status: "paid",
      createdAt: new Date().toISOString(),
    };
    const newBalance = Math.max(0, Number(owner.balance || 0) - creditUsed).toFixed(2);

    if (isLocal) {
      await localDb.payments.insert(newPayment);
      if (creditUsed > 0) await localDb.users.update(owner.id, { balance: newBalance });
      await localDb.projects.update(projectId, { paymentStatus: "paid", isPublished: true, plan: planType, tileSize: `${getTileSize(planType)}px` });
    } else if (db) {
      await db.insert(payments).values({ ...newPayment, createdAt: new Date() });
      if (creditUsed > 0) await db.update(users).set({ balance: newBalance }).where(eq(users.id, owner.id));
      await db.update(projects).set({ paymentStatus: "paid", isPublished: true, plan: planType, tileSize: `${getTileSize(planType)}px`, updatedAt: new Date() }).where(eq(projects.id, projectId));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 });
  }
}
