import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { auth } from "./auth.js";
import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/typeDefs.js";
import type { GraphQLContext } from "./types/context.js";
import { fromNodeHeaders } from "better-auth/node";

export async function createApp(context: GraphQLContext) {
  const app = express();

  const webOrigin = process.env.WEB_ORIGIN;

  if (!webOrigin) {
    throw new Error("WEB_ORIGIN is not configured");
  }

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
  });

  await server.start();

  // CORS must support cross-origin authentication cookies.
  app.use(
    cors({
      origin: webOrigin,
      credentials: true,
    }),
  );

  // Better Auth must run before express.json().
  app.all("/api/auth/*splat", toNodeHandler(auth));

  // Health endpoint.
  app.get("/health", (_req, res) => {
    res.json({ status: "OK" });
  });

  // GraphQL endpoint.
  app.use(
  "/graphql",
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      return {
        ...context,
        session,
      };
    },
  }),
);


  return { app, server };
}
