
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "user",
  password: "",
  database: "db_name",
});


// test the db connection
export const testDB = async () => {
  try {
    await db.query("SELECT 1");
    console.log("MySQL connected");
  } catch (err) {
    console.error("MySQL connection failed", err);
  }
};
