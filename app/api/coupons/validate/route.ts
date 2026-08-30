import { NextResponse } from "next/server";
import { cleanText, rateLimit, rejectCrossSiteRequest, rejectLargeRequest } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const rejected = rejectCrossSiteRequest(req) || rejectLargeRequest(req, 5_000) || rateLimit(req, "coupon", 20, 60_000);
    if (rejected) return rejected;
    const body = await req.json();
    const couponCode = cleanText(body.couponCode, 50);
    const planType = cleanText(body.planType, 20);

    if (!couponCode || !planType) {
      return NextResponse.json({ success: false, error: "Missing required details" }, { status: 400 });
    }

    if (couponCode.toUpperCase() === "EARLYBUILDER" && planType.toLowerCase() === "small") {
      return NextResponse.json({ success: true, discount: 1.00 });
    }

    return NextResponse.json({ success: false, error: "Invalid coupon code for this plan" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to validate coupon" }, { status: 500 });
  }
}
