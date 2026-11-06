import "dotenv/config";

import { prisma } from "./lib/prisma.js";
import { createApp } from "./app.js";

async function startServer() {
  const PORT = Number(process.env.PORT) || 4000;

  const { app } = await createApp({ prisma });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
