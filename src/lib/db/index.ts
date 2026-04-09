import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { runMigrations } from "./migrate";

const client = createClient({
	url: process.env.DATABASE_URL || "file:local.db",
});

export const db = drizzle(client, { schema });

// Auto-run migrations on startup
if (process.env.NODE_ENV === "production") {
	runMigrations();
}
