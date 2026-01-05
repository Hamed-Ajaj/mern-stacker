import mysql from "mysql2/promise";

const port = Number(process.env.DB_PORT || 3306);

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_NAME || "app_db",
  port: Number.isNaN(port) ? 3306 : port,
});

export const testDB = async () => {
  try {
    await db.query("SELECT 1");
    console.log("MySQL connected");
  } catch (err) {
    console.error("MySQL connection failed", err);
  }
};
