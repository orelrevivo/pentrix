import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ success: false, error: "This endpoint has been retired. Use Clerk sign-out." }, { status: 410 });
}
