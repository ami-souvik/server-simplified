import { db } from "./index";
import { sessions, messages } from "./schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export async function createSession(title: string, id: string = uuidv4()) {
	await db
		.insert(sessions)
		.values({
			id,
			title,
			createdAt: new Date(),
		})
		.onConflictDoNothing();
	return id;
}

export async function saveMessage(
	sessionId: string,
	role: "user" | "assistant",
	content: string,
	type: "text" | "command" | "result" = "text"
) {
	// Ensure session exists (for new session IDs or default)
	await createSession(sessionId === "default" ? "Default Session" : "New Chat", sessionId);
	await db.insert(messages).values({
		id: uuidv4(),
		sessionId,
		role,
		content: content || "",
		type,
		createdAt: new Date(),
	});
}

export async function getSessionMessages(sessionId: string) {
	return await db.query.messages.findMany({
		where: eq(messages.sessionId, sessionId),
		orderBy: (messages, { asc }) => [asc(messages.createdAt)],
	});
}

export async function getSessions() {
	return await db.query.sessions.findMany({
		orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
	});
}

export async function updateSessionTitle(id: string, title: string) {
	await db.update(sessions).set({ title }).where(eq(sessions.id, id));
}

export async function deleteSession(id: string) {
	// Manually delete messages first to avoid FK constraint issues
	await db.delete(messages).where(eq(messages.sessionId, id));
	await db.delete(sessions).where(eq(sessions.id, id));
}
