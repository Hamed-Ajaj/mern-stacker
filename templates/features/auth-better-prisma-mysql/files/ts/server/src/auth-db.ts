import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const authDatabase = prismaAdapter(prisma, { provider: "mysql" });
