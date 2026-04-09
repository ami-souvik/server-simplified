import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";

export async function runMigrations() {
	try {
		console.log("⏳ Running database migrations...");
		await migrate(db, { migrationsFolder: "./drizzle" });
		console.log("✅ Migrations completed successfully.");
	} catch (error) {
		console.error("❌ Migration failed:", error);
		// Don't exit here, the app might still work if tables exist
	}
}
