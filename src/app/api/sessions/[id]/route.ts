import { NextResponse } from "next/server";
import { updateSessionTitle, deleteSession } from "@/lib/db/actions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { title } = await req.json();
		await updateSessionTitle(id, title);
		return NextResponse.json({ success: true });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		await deleteSession(id);
		return NextResponse.json({ success: true });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
