import pg from "pg";

const { Pool } = pg;
const port = Number(process.env.DB_PORT || 5432);

export const db = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_NAME || "app_db",
  port: Number.isNaN(port) ? 5432 : port,
});

export const testDB = async () => {
  try {
    await db.query("SELECT 1");
    console.log("Postgres connected");
  } catch (err) {
    console.error("Postgres connection failed", err);
  }
};

export const ensureUsersTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
};
