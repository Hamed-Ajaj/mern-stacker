import { PrismaClient } from "@prisma/client";
import { PrismaMysql } from "@prisma/adapter-mysql";
import mysql from "mysql2/promise";

const databaseUrl =
  process.env.DATABASE_URL || "mysql://app:app@localhost:3306/app_db";

const pool = mysql.createPool(databaseUrl);
const adapter = new PrismaMysql(pool);

export const prisma = new PrismaClient({ adapter });

export const testDB = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("MySQL connected");
  } catch (err) {
    console.error("MySQL connection failed", err);
  }
};
