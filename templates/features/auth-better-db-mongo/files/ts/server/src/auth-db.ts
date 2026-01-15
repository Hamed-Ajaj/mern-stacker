import mongoose from "mongoose";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectDB } from "./db";

await connectDB();

export const authDatabase = mongodbAdapter(mongoose.connection.getClient());
