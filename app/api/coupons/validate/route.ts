import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { couponCode, planType } = await req.json();

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
