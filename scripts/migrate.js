const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("pg");

async function runWithDeps(deps) {
  const databaseUrl = deps.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const migrationsDir = deps.path.resolve(deps.cwd(), "db", "migrations");
  const files = (await deps.fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No SQL migrations found.");
    return;
  }

  const pool = new deps.Pool({
    connectionString: databaseUrl,
    ssl: deps.env.PGSSLMODE === "disable" ? false : undefined,
  });

  try {
    for (const file of files) {
      const fullPath = deps.path.join(migrationsDir, file);
      const sql = await deps.fs.readFile(fullPath, "utf8");
      if (!sql.trim()) {
        continue;
      }
      await pool.query(sql);
      console.log(`Applied ${file}`);
    }
  } finally {
    await pool.end();
  }
}

async function run() {
  return runWithDeps({
    fs,
    path,
    Pool,
    env: process.env,
    cwd: process.cwd,
  });
}

module.exports = { run, runWithDeps };

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
