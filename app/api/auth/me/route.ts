import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const userId = await getSession();
    if (!userId) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ success: true, authenticated: true, userId });
  } catch (error) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 500 });
  }
}
