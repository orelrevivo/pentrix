import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from .env manually (no dotenv needed)
const envPath = resolve(__dirname, "../.env");
const envContents = readFileSync(envPath, "utf-8");
const match = envContents.match(/DATABASE_URL="?([^"\n]+)"?/);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const sql = neon(match[1]);

async function migratePasswords() {
  console.log("Fetching all users from database...");
  const users = await sql`SELECT id, email, password_hash FROM users`;

  if (users.length === 0) {
    console.log("No users found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${users.length} user(s). Checking which need hashing...`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    const hash = user.password_hash;

    // bcrypt hashes always start with $2a$, $2b$, or $2y$ — skip already-hashed passwords
    if (hash && hash.startsWith("$2")) {
      console.log(`  [SKIP]    ${user.email} — already hashed`);
      skipped++;
      continue;
    }

    const newHash = await bcrypt.hash(hash, 12);
    await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${user.id}`;
    console.log(`  [HASHED]  ${user.email}`);
    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped (already hashed): ${skipped}`);
}

migratePasswords().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
