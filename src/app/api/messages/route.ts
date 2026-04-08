import { NextRequest, NextResponse } from "next/server";
import { getSessionMessages } from "@/lib/db/actions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") || "default";

  try {
    const messages = await getSessionMessages(sessionId);
    return NextResponse.json(messages);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
