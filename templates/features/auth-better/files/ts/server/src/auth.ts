import { betterAuth } from "better-auth";
import { authDatabase } from "./auth-db";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not defined");
}

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:4000";

export const auth = betterAuth({
  secret,
  baseURL,
  database: authDatabase,
  emailAndPassword: {
    enabled: true,
  },
});
