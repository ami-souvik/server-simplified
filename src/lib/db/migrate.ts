import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";
import path from "path";
import fs from "fs";

let migrationPromise: Promise<void> | null = null;

export async function ensureMigration() {
	if (
		!migrationPromise &&
		process.env.NODE_ENV === "production" &&
		!process.env.SKIP_DB_MIGRATE
	) {
		migrationPromise = runMigrations();
	}
	if (migrationPromise) {
		await migrationPromise;
	}
}

export async function runMigrations() {
	try {
		console.log("⏳ Initializing database migrations check...");
		const migrationsFolder = path.join(process.cwd(), "drizzle");

		if (!fs.existsSync(migrationsFolder)) {
			console.error(`❌ Migrations folder NOT found at: ${migrationsFolder}`);
			throw new Error(`Migrations folder not found: ${migrationsFolder}`);
		}

		const files = fs.readdirSync(migrationsFolder);
		console.log(`📄 Found ${files.length} items in migrations folder: ${files.join(", ")}`);

		console.log("🚀 Starting Drizzle migrate...");
		await migrate(db, { migrationsFolder });
		console.log("✅ Database migrations completed successfully.");
	} catch (error) {
		console.error("❌ Migration process failed:", error);
		migrationPromise = null; // Allow retry on next request
		throw error;
	}
}
