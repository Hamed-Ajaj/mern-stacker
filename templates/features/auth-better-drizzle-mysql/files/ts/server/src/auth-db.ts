import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const authDatabase = drizzleAdapter(db, { provider: "mysql" });
