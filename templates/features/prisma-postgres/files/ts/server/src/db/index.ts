import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://app:app@localhost:5432/app_db?schema=public";

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export const testDB = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Postgres connected");
  } catch (err) {
    console.error("Postgres connection failed", err);
  }
};
