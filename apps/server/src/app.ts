import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";

import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/typeDefs.js";
import type { GraphQLContext } from "./types/context.js";

export async function createApp(context: GraphQLContext) {
  const app = express();

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.get("/health", (_req, res) => {
    res.json({ status: "OK" });
  });

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async () => context,
    }),
  );

  return { app, server };
}
