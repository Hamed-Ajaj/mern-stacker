import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

function issueAuthCookie(res, userId) {
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

function clearAuthCookie(res) {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

function getCredentials(req) {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }
  return { email, password };
}

function handleAuthError(res, error, context) {
  const err = error;
  if (context === "signup" && err?.code === "ER_DUP_ENTRY") {
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
    const [result] = await db.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [credentials.email, hashedPassword],
    );
    const userId = result.insertId;

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
    const [rows] = await db.query(
      "SELECT id, email, password FROM users WHERE email = ?",
      [credentials.email],
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(credentials.password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    issueAuthCookie(res, user.id);
    return res.json({ message: "Logged in" });
  } catch (error) {
    return handleAuthError(res, error, "login");
  }
});

app.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});
