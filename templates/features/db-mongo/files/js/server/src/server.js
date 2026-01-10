import "dotenv/config";
import { app } from "./app.js";
import { connectDB } from "./db/index.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
