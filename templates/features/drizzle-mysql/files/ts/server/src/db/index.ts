import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const port = Number(process.env.DB_PORT || 3306);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_NAME || "app_db",
  port: Number.isNaN(port) ? 3306 : port,
});

export const db = drizzle(pool);

export const testDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL connected");
  } catch (err) {
    console.error("MySQL connection failed", err);
  }
};
