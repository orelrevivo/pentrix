import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, "../.env");
const envContents = readFileSync(envPath, "utf-8");
const match = envContents.match(/DATABASE_URL="?([^"\n]+)"?/);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const sql = neon(match[1]);

async function migrate() {
  console.log("Adding needs_password_reset column if it doesn't exist...");
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN NOT NULL DEFAULT FALSE
  `;

  console.log("Flagging all existing users as needs_password_reset = TRUE...");
  const result = await sql`
    UPDATE users SET needs_password_reset = TRUE WHERE needs_password_reset = FALSE
  `;

  console.log(`Done. ${result.length ?? "All"} users flagged for mandatory password reset.`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
