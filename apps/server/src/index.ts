import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";

import { prisma } from "./lib/prisma.js";
import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/typeDefs.js";
import type { GraphQLContext } from "./types/context.js";

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 4000;

  await server.start();

  app.get("/health", (_req, res) => {
    res.json({ status: "OK" });
  });

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async () => ({
        prisma,
      }),
    }),
  );

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
