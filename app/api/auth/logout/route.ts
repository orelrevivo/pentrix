import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
