import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL || "mysql://app:app@localhost:3306/app_db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
