import mongoose, { Schema } from "mongoose";

type UserFields = {
  email: string;
  password: string;
};

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/app_db";
let connectionPromise: Promise<typeof mongoose> | null = null;

const userSchema = new Schema<UserFields>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

export const User =
  (mongoose.models.User as mongoose.Model<UserFields>) ||
  mongoose.model<UserFields>("User", userSchema);

export const connectDB = async () => {
  try {
    if (!connectionPromise) {
      connectionPromise = mongoose.connect(mongoUri);
    }
    await connectionPromise;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed", err);
  }
};
