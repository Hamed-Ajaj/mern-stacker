import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";

type UserRow = {
  id: number;
  email: string;
  password: string;
};

export const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

function issueAuthCookie(res: Response, userId: number) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const token = jwt.sign({ userId }, secret, { expiresIn: "1h" });

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

function getCredentials(req: Request) {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }
  return { email, password };
}

function handleAuthError(
  res: Response,
  error: unknown,
  context: "login" | "signup",
) {
  const err = error as { code?: string };
  if (context === "signup" && err?.code === "23505") {
    return res.status(409).json({ message: "Email already in use" });
  }

  console.error(`${context} error:`, error);
  return res.status(500).json({ message: "Internal server error" });
}

app.post("/signup", async (req, res) => {
  const credentials = getCredentials(req);
  if (!credentials) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    await db.insert(users).values({
      email: credentials.email,
      password: hashedPassword,
    });

    const [createdUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, credentials.email))
      .limit(1);
    const userId = createdUser?.id;

    if (!userId) {
      throw new Error("Failed to create user");
    }

    issueAuthCookie(res, userId);
    return res.status(201).json({ message: "Account created" });
  } catch (error) {
    return handleAuthError(res, error, "signup");
  }
});

app.post("/login", async (req, res) => {
  const credentials = getCredentials(req);
  if (!credentials) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, credentials.email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(
      credentials.password,
      (user as UserRow).password,
    );
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    issueAuthCookie(res, (user as UserRow).id);
    return res.json({ message: "Logged in" });
  } catch (error) {
    return handleAuthError(res, error, "login");
  }
});

app.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});
