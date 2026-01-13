import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const port = Number(process.env.DB_PORT || 5432);

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_NAME || "app_db",
  port: Number.isNaN(port) ? 5432 : port,
});

export const db = drizzle(pool);

export const testDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Postgres connected");
  } catch (err) {
    console.error("Postgres connection failed", err);
  }
};
