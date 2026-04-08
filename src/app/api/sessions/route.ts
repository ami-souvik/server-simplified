import { NextResponse } from "next/server";
import { getSessions, createSession } from "@/lib/db/actions";

export async function GET() {
	try {
		const sessions = await getSessions();
		return NextResponse.json(sessions);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const { title } = await req.json();
		const sessionId = await createSession(title || "New Chat");
		return NextResponse.json({ sessionId });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
