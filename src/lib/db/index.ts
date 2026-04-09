import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { runMigrations } from "./migrate";

const client = createClient({
	url: process.env.DATABASE_URL || "file:local.db",
});

export const db = drizzle(client, { schema });

// Migrations are managed via gated calls in server entry points or API routes
// to avoid race conditions in multi-worker environments (like Next.js build or start)
