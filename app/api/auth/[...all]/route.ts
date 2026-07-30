import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return await auth.handler(request);
  } catch (error: any) {
    console.error("Auth GET error:", error);
    return NextResponse.json({ error: error?.message || "Auth error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await auth.handler(request);
  } catch (error: any) {
    console.error("Auth POST error:", error);
    return NextResponse.json({ error: error?.message || "Auth error" }, { status: 500 });
  }
}
