import { app } from "./app.js";
import { testDB } from "./db/index.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await testDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
