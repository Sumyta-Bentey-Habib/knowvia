import type { auth } from "../auth.js";
import type { prisma } from "../lib/prisma.js";

export type AuthSession = Awaited<
  ReturnType<typeof auth.api.getSession>
>;

export type AppContext = {
  prisma: typeof prisma;
};

export type GraphQLContext = AppContext & {
  session: AuthSession;
};
