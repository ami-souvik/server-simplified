import { NextResponse } from "next/server";
import { getSessions, createSession } from "@/lib/db/actions";

export async function GET() {
    try {
        const sessions = await getSessions();
        return NextResponse.json(sessions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { title } = await req.json();
        const sessionId = await createSession(title || "New Chat");
        return NextResponse.json({ sessionId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
