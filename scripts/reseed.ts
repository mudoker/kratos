
import { pool, ensureAppTables } from "./lib/db";

async function run() {
  console.log("Re-seeding exercise catalog...");
  await ensureAppTables();
  console.log("Catalog updated.");
  await pool.end();
}

run().catch(console.error);
