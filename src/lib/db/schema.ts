import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const messages = sqliteTable("messages", {
	id: text("id").primaryKey(),
	sessionId: text("session_id")
		.notNull()
		.references(() => sessions.id, { onDelete: "cascade" }),
	role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
	content: text("content").notNull(),
	type: text("type", { enum: ["text", "command", "result", "thought"] }).default("text"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
